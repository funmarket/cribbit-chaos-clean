import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';

import { createNodeApiHandler } from '../apps/api/src/node-runtime.ts';

const BOT_TOKEN = '123456:test-token';

function telegramInitData(userId, username) {
  const authDate = Math.floor(Date.now() / 1000);
  const user = JSON.stringify({ id: userId, first_name: username, username });
  const params = new URLSearchParams({ auth_date: String(authDate), user });
  const dataCheckString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex');
  params.set('hash', hash);
  return params.toString();
}

async function withServer(run) {
  const handler = createNodeApiHandler({
    databaseUrl: '',
    checkConnection: async () => {},
    telegramBotToken: BOT_TOKEN,
    sessionSecret: 'cross-client-link-secret'
  });
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

async function json(response) {
  const body = await response.json();
  assert.ok(response.ok, JSON.stringify(body));
  return body;
}

test('Web credentials and linked Telegram identity resolve to one users.id and share the same active game seat', async () => {
  await withServer(async (baseUrl) => {
    const guestResponse = await fetch(`${baseUrl}/api/auth/web/guest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Alice' })
    });
    const guest = await json(guestResponse);
    let webCookie = guestResponse.headers.get('set-cookie').split(';')[0];

    const registerResponse = await fetch(`${baseUrl}/api/auth/web/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: webCookie },
      body: JSON.stringify({ loginUsername: 'alice', password: 'correct-horse', displayName: 'Alice' })
    });
    const registered = await json(registerResponse);
    webCookie = registerResponse.headers.get('set-cookie').split(';')[0];
    assert.equal(registered.user.id, guest.user.id);

    const linkCode = await json(await fetch(`${baseUrl}/api/auth/telegram-link/code`, {
      method: 'POST',
      headers: { cookie: webCookie }
    }));
    const aliceTma = telegramInitData(101, 'alice_tg');
    const claimed = await json(await fetch(`${baseUrl}/api/auth/telegram-link/claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `tma ${aliceTma}` },
      body: JSON.stringify({ code: linkCode.code })
    }));
    assert.equal(claimed.user.id, guest.user.id);

    const telegramMe = await json(await fetch(`${baseUrl}/api/auth/me`, {
      headers: { authorization: `tma ${aliceTma}` }
    }));
    assert.equal(telegramMe.user.id, guest.user.id);

    const created = await json(await fetch(`${baseUrl}/api/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: webCookie },
      body: JSON.stringify({ displayName: 'Alice' })
    }));

    const sameSeat = await json(await fetch(`${baseUrl}/api/sessions/${created.player.sessionId}/projection`, {
      headers: { authorization: `tma ${aliceTma}` }
    }));
    assert.equal(sameSeat.projection.currentPlayer.playerId, created.player.playerId);

    const bobTma = telegramInitData(202, 'bob_tg');
    const bobAccount = await json(await fetch(`${baseUrl}/api/auth/telegram/account`, {
      method: 'POST',
      headers: { authorization: `tma ${bobTma}` }
    }));
    assert.notEqual(bobAccount.user.id, guest.user.id);

    const bobJoin = await json(await fetch(`${baseUrl}/api/sessions/${created.player.sessionId}/join`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `tma ${bobTma}` },
      body: JSON.stringify({ displayName: 'Bob' })
    }));
    assert.equal(bobJoin.player.playerId, 'p2');

    const started = await json(await fetch(`${baseUrl}/api/sessions/${created.player.sessionId}/start`, {
      method: 'POST',
      headers: { cookie: webCookie }
    }));
    const bobProjection = await json(await fetch(`${baseUrl}/api/sessions/${created.player.sessionId}/projection`, {
      headers: { authorization: `tma ${bobTma}` }
    }));
    assert.equal(bobProjection.projection.revision, started.projection.revision);
    assert.equal(bobProjection.projection.currentPlayer.hand.length, 7);
    assert.equal(JSON.stringify(bobProjection.projection).includes(started.projection.currentPlayer.hand[0].instanceId), false);

    await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { cookie: webCookie } });
    const loginResponse = await fetch(`${baseUrl}/api/auth/web/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ loginUsername: 'alice', password: 'correct-horse' })
    });
    const loggedIn = await json(loginResponse);
    assert.equal(loggedIn.user.id, guest.user.id);
  });
});


test('Telegram-only and Web-only accounts stay independent until the user explicitly links them', async () => {
  await withServer(async (baseUrl) => {
    const telegramAuth = telegramInitData(303, 'same_name');
    const telegramAccount = await json(await fetch(`${baseUrl}/api/auth/telegram/account`, {
      method: 'POST',
      headers: { authorization: `tma ${telegramAuth}` }
    }));

    const telegramMethods = await json(await fetch(`${baseUrl}/api/auth/login-methods`, {
      headers: { authorization: `tma ${telegramAuth}` }
    }));
    assert.equal(telegramMethods.web, null);
    assert.equal(telegramMethods.telegram.username, 'same_name');
    assert.equal(telegramMethods.suggestedWebLoginUsername, 'same_name');

    const telegramGame = await json(await fetch(`${baseUrl}/api/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `tma ${telegramAuth}` },
      body: JSON.stringify({ displayName: 'Telegram Only' })
    }));
    assert.equal(telegramGame.player.playerId, 'p1');

    const webRegister = await fetch(`${baseUrl}/api/auth/web/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ loginUsername: 'same_name', password: 'correct-horse', displayName: 'Web Only' })
    });
    const webAccount = await json(webRegister);
    const webCookie = webRegister.headers.get('set-cookie').split(';')[0];

    assert.notEqual(webAccount.user.id, telegramAccount.user.id);

    const webMethods = await json(await fetch(`${baseUrl}/api/auth/login-methods`, {
      headers: { cookie: webCookie }
    }));
    assert.equal(webMethods.web.loginUsername, 'same_name');
    assert.equal(webMethods.telegram, null);
    assert.equal(webMethods.suggestedWebLoginUsername, null);

    const webGame = await json(await fetch(`${baseUrl}/api/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: webCookie },
      body: JSON.stringify({ displayName: 'Web Only' })
    }));
    assert.equal(webGame.player.playerId, 'p1');

    const telegramMethodsAfterCollision = await json(await fetch(`${baseUrl}/api/auth/login-methods`, {
      headers: { authorization: `tma ${telegramAuth}` }
    }));
    assert.equal(telegramMethodsAfterCollision.suggestedWebLoginUsername, null);
    assert.equal(telegramMethodsAfterCollision.web, null);
  });
});

test('Telegram-only account can optionally add a Web login using its suggested username without changing users.id', async () => {
  await withServer(async (baseUrl) => {
    const telegramAuth = telegramInitData(404, 'linked_name');
    const telegramAccount = await json(await fetch(`${baseUrl}/api/auth/telegram/account`, {
      method: 'POST',
      headers: { authorization: `tma ${telegramAuth}` }
    }));

    const before = await json(await fetch(`${baseUrl}/api/auth/login-methods`, {
      headers: { authorization: `tma ${telegramAuth}` }
    }));
    assert.equal(before.web, null);
    assert.equal(before.suggestedWebLoginUsername, 'linked_name');

    const attachResponse = await fetch(`${baseUrl}/api/auth/web/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `tma ${telegramAuth}` },
      body: JSON.stringify({ loginUsername: before.suggestedWebLoginUsername, password: 'correct-horse', displayName: 'Linked Name' })
    });
    const attached = await json(attachResponse);
    assert.equal(attached.user.id, telegramAccount.user.id);

    const after = await json(await fetch(`${baseUrl}/api/auth/login-methods`, {
      headers: { authorization: `tma ${telegramAuth}` }
    }));
    assert.equal(after.web.loginUsername, 'linked_name');
    assert.equal(after.telegram.username, 'linked_name');
    assert.equal(after.suggestedWebLoginUsername, null);

    const webLogin = await json(await fetch(`${baseUrl}/api/auth/web/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ loginUsername: 'linked_name', password: 'correct-horse' })
    }));
    assert.equal(webLogin.user.id, telegramAccount.user.id);
  });
});
