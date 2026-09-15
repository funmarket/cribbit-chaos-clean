import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const servicePath = 'apps/api/src/command-service.ts';
const portsPath = 'apps/api/src/ports.ts';
const contractsPath = 'packages/contracts/src/commands.ts';

const gameplayVocabulary = [
  'DRAW_CARD',
  'PLAY_CARD',
  'DUEL',
  'TRUTH',
  'DARE',
  'PARANOIA',
  'ROULETTE',
  'NOPE',
  'REWIND_PROMPT'
];

test('P5 command service contains orchestration only, not gameplay-family semantics or infrastructure authority', async () => {
  const source = await readFile(servicePath, 'utf8');
  for (const term of gameplayVocabulary) {
    assert.equal(source.includes(term), false, `${servicePath} must not implement ${term} semantics`);
  }

  for (const forbidden of [
    /\bPrisma\b/,
    /\bpostgres/i,
    /\bWebSocket\b/,
    /\bfetch\s*\(/,
    /\blocalStorage\b/,
    /\bMath\.random\b/,
    /\bDate\.now\b/
  ]) {
    assert.equal(forbidden.test(source), false, `${servicePath} gained forbidden authority: ${forbidden}`);
  }
});

test('P5 ports are interfaces only and do not provide an in-memory production fallback', async () => {
  const source = await readFile(portsPath, 'utf8');
  assert.match(source, /export interface AuthenticationPort/);
  assert.match(source, /export interface CommandTransactionPort/);
  assert.match(source, /export interface EngineCommandResolver/);
  assert.equal(/new\s+Map\s*\(/.test(source), false);
  assert.equal(/class\s+InMemory/i.test(source), false);
});

test('P5 structural command contracts do not freeze gameplay command families or client actor identity', async () => {
  const source = await readFile(contractsPath, 'utf8');
  assert.match(source, /readonly commandId: string/);
  assert.match(source, /readonly commandFingerprint: string/);
  assert.match(source, /readonly expectedRevision: number/);
  assert.equal(/readonly actorPlayerId: string;[\s\S]*interface GameCommandEnvelope/.test(source), false);
  for (const term of gameplayVocabulary) {
    assert.equal(source.includes(term), false, `${contractsPath} must not freeze ${term} in P5`);
  }
});
