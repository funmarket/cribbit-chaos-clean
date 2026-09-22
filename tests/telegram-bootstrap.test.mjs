import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Telegram loads the official WebApp SDK before the app module and Web does not', async () => {
  const [telegramHtml, webHtml] = await Promise.all([
    readFile(new URL('../apps/telegram/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../apps/web/index.html', import.meta.url), 'utf8')
  ]);

  const sdk = '<script src="https://telegram.org/js/telegram-web-app.js"></script>';
  const appModule = '<script type="module" src="/src/main.ts"></script>';

  assert.notEqual(telegramHtml.indexOf(sdk), -1);
  assert.notEqual(telegramHtml.indexOf(appModule), -1);
  assert.ok(telegramHtml.indexOf(sdk) < telegramHtml.indexOf(appModule));
  assert.equal(webHtml.includes('telegram-web-app.js'), false);
});

test('Telegram keeps the clean platform adapter and no client gameplay authority', async () => {
  const [telegramMain, telegramPlatform] = await Promise.all([
    readFile(new URL('../apps/telegram/src/main.ts', import.meta.url), 'utf8'),
    readFile(new URL('../packages/platform/src/telegram.ts', import.meta.url), 'utf8')
  ]);

  assert.match(telegramMain, /@cribbit\/platform\/telegram/);
  assert.match(telegramMain, /createTelegramAdapter\(\)/);
  assert.match(telegramPlatform, /window\.Telegram\?\.WebApp\?\.initData/);
  assert.match(telegramPlatform, /authorization: `tma \$\{initData\}`/);

  for (const source of [telegramMain, telegramPlatform]) {
    assert.doesNotMatch(source, /TELEGRAM_BOT_TOKEN|@cribbit\/game-engine|canonical-game-runtime|legacy-runtime/);
  }
});
