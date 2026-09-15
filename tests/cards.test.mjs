import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';

import {
  CANONICAL_CARD_INSTANCES,
  CANONICAL_DECK_SIZE,
  CANONICAL_FAMILY_COUNTS,
  CARD_DEFINITIONS,
  CARD_DEFINITIONS_BY_ID,
  DECK_SPEC_ID
} from '../packages/cards/src/server.ts';
import {
  CARD_BACK_ASSET,
  resolveCardFaceAsset
} from '../packages/cards/src/presentation.ts';

const ROOT = process.cwd();
const CARDS_ROOT = path.join(ROOT, 'packages/cards');
const ASSET_ROOT = path.join(CARDS_ROOT, 'assets/CHAOS-133-V1');

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(full));
    else files.push(full);
  }
  return files;
}

function relativeToCards(file) {
  return path.relative(CARDS_ROOT, file).split(path.sep).join('/');
}

function presentationIdentity(instance) {
  return {
    family: instance.family,
    copy: instance.copy,
    ...(instance.color === undefined ? {} : { color: instance.color }),
    ...(instance.value === undefined ? {} : { value: instance.value })
  };
}

test('P2 canonical inventory is exactly CHAOS-133-V1 with unique physical IDs', () => {
  assert.equal(DECK_SPEC_ID, 'CHAOS-133-V1');
  assert.equal(CANONICAL_DECK_SIZE, 133);
  assert.equal(CANONICAL_CARD_INSTANCES.length, 133);
  assert.equal(new Set(CANONICAL_CARD_INSTANCES.map((card) => card.instanceId)).size, 133);
  assert.equal(CARD_DEFINITIONS.length, 58);
  assert.equal(CARD_DEFINITIONS_BY_ID.size, 58);
});

test('P2 family counts exactly match the approved 19-family inventory', () => {
  const expected = {
    number: 76,
    skip: 6,
    reverse: 6,
    draw: 6,
    wild: 3,
    truth: 3,
    dare: 3,
    paranoia: 3,
    chaos: 3,
    duel: 3,
    nope: 3,
    tag: 3,
    truth_or_chaos: 3,
    hijack: 3,
    taboo: 3,
    machiavelli: 1,
    ghost: 1,
    reverse_confession: 3,
    dig_me: 1
  };
  assert.deepEqual(CANONICAL_FAMILY_COUNTS, expected);
  assert.equal(Object.keys(CANONICAL_FAMILY_COUNTS).length, 19);
  for (const [family, count] of Object.entries(expected)) {
    assert.equal(CANONICAL_CARD_INSTANCES.filter((card) => card.family === family).length, count, family);
  }
});

test('number inventory is one zero and two copies of 1-9 per approved color', () => {
  for (const color of ['lime', 'orange', 'cyan', 'purple']) {
    const cards = CANONICAL_CARD_INSTANCES.filter((card) => card.family === 'number' && card.color === color);
    assert.equal(cards.length, 19, color);
    assert.equal(cards.filter((card) => card.value === 0).length, 1, `${color} zero`);
    for (let value = 1; value <= 9; value += 1) {
      assert.equal(cards.filter((card) => card.value === value).length, 2, `${color} ${value}`);
    }
  }
});

test('every physical instance resolves to exactly one canonical definition', () => {
  for (const instance of CANONICAL_CARD_INSTANCES) {
    const definition = CARD_DEFINITIONS_BY_ID.get(instance.definitionId);
    assert.ok(definition, instance.instanceId);
    assert.equal(instance.family, definition.family, instance.instanceId);
    assert.equal(instance.color, definition.color, instance.instanceId);
    assert.equal(instance.value, definition.value, instance.instanceId);
  }
  for (const definition of CARD_DEFINITIONS) {
    assert.equal(
      CANONICAL_CARD_INSTANCES.filter((card) => card.definitionId === definition.id).length,
      definition.copies,
      definition.id
    );
  }
});

test('Skip, Reverse and Draw are uncolored and Wild has exactly three copies', () => {
  for (const family of ['skip', 'reverse', 'draw']) {
    const instances = CANONICAL_CARD_INSTANCES.filter((card) => card.family === family);
    assert.equal(instances.length, 6, family);
    assert.ok(instances.every((card) => card.color === undefined), `${family} must not carry color metadata`);
  }
  assert.equal(CANONICAL_CARD_INSTANCES.filter((card) => card.family === 'wild').length, 3);
});

test('Lime 1 preserves two physical cards while sharing the approved valid artwork', () => {
  const limeOnes = CANONICAL_CARD_INSTANCES.filter(
    (card) => card.family === 'number' && card.color === 'lime' && card.value === 1
  );
  assert.deepEqual(limeOnes.map((card) => card.instanceId), ['number_lime_1_01', 'number_lime_1_02']);
  const assets = limeOnes.map((card) => resolveCardFaceAsset(presentationIdentity(card)));
  assert.deepEqual(assets, [
    'assets/CHAOS-133-V1/cards/numbers/lime/number_lime_1_01.jpg',
    'assets/CHAOS-133-V1/cards/numbers/lime/number_lime_1_01.jpg'
  ]);
});

test('every physical card maps to approved presentation artwork and every staged JPG is used', async () => {
  const faceAssets = CANONICAL_CARD_INSTANCES.map((card) => {
    const asset = resolveCardFaceAsset(presentationIdentity(card));
    assert.ok(asset, card.instanceId);
    return asset;
  });
  const referenced = new Set([CARD_BACK_ASSET, ...faceAssets]);
  assert.equal(faceAssets.length, 133);
  assert.equal(new Set(faceAssets).size, 132, 'only the second Lime 1 shares a face asset');
  assert.equal(referenced.size, 133, '132 face files plus one card back');

  const staged = (await walkFiles(ASSET_ROOT))
    .filter((file) => file.endsWith('.jpg'))
    .map(relativeToCards)
    .sort();
  assert.equal(staged.length, 133);
  assert.deepEqual(staged, [...referenced].sort());
  assert.equal(staged.includes('assets/CHAOS-133-V1/cards/numbers/lime/number_lime_1_02.jpg'), false);

  for (const asset of referenced) {
    const bytes = await readFile(path.join(CARDS_ROOT, asset));
    assert.ok(bytes.length > 4, asset);
    assert.equal(bytes[0], 0xff, asset);
    assert.equal(bytes[1], 0xd8, asset);
    assert.equal(bytes.at(-2), 0xff, asset);
    assert.equal(bytes.at(-1), 0xd9, asset);
  }
});

test('asset provenance pins preservation evidence and the Lime 1 content hash', async () => {
  const provenance = JSON.parse(await readFile(path.join(CARDS_ROOT, 'asset-provenance.json'), 'utf8'));
  assert.equal(provenance.specId, 'CHAOS-133-V1');
  assert.equal(provenance.source.repository, 'funmarket/cribbit-chaos');
  assert.equal(provenance.source.commit, '77c455901516205633eb15e96f51a84206eb8174');
  assert.equal(provenance.source.tree, '84d791d4c7f06aa519cee82da0b3bbe35ab5fe55');
  assert.equal(provenance.source.assetTreeBlob, 'be36e2003403335375871ec4bfdb84c255290da9');
  assert.equal(provenance.source.deckManifestBlob, 'b6e5143d58d83a4742356d7e31cb1022330f4326');
  assert.equal(provenance.excludedBrokenSourceAsset.bytes, 0);

  const limeAsset = path.join(CARDS_ROOT, provenance.limeOneSharedArtwork.asset);
  const bytes = await readFile(limeAsset);
  assert.equal(bytes.length, provenance.limeOneSharedArtwork.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), provenance.limeOneSharedArtwork.sha256);
});

test('presentation surface exposes rendering metadata, not server inventory or a deck constructor', async () => {
  const presentation = await import('../packages/cards/src/presentation.ts');
  assert.equal('CANONICAL_CARD_INSTANCES' in presentation, false);
  assert.equal('CARD_DEFINITIONS' in presentation, false);
  assert.equal('buildDeck' in presentation, false);
  assert.equal('createDeck' in presentation, false);

  const source = await readFile(path.join(CARDS_ROOT, 'src/presentation.ts'), 'utf8');
  assert.doesNotMatch(source, /from ['"]\.\/inventory\.ts['"]/);
  assert.doesNotMatch(source, /buildDeck|createCanonicalDeck/);
});
