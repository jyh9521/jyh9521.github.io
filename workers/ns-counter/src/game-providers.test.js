import test from 'node:test';
import assert from 'node:assert/strict';
import { areSameGame, combineCandidates, mergeMetadata, normalizeRawgGame, normalizeScreenScraperGame, ScreenScraperProvider } from './game-providers.js';

test('RAWG records are normalized without leaking provider field shape', () => {
  const game = normalizeRawgGame({
    id: 42, name: 'Resident Evil 2', name_original: 'Biohazard 2', released: '1998-01-21',
    description_raw: 'A survival horror game.', developers: [{ name: 'Capcom' }],
    publishers: [{ name: 'Capcom' }], platforms: [{ platform: { name: 'PlayStation' } }],
    genres: [{ name: 'Action' }], background_image: 'https://example.test/cover.jpg', website: 'https://example.test',
  });
  assert.equal(game.id, 'rawg:42');
  assert.equal(game.originalName, 'Biohazard 2');
  assert.deepEqual(game.platforms, ['PlayStation']);
  assert.deepEqual(game.developers, ['Capcom']);
  assert.equal(game.cover, 'https://example.test/cover.jpg');
  assert.equal(game.sources.rawg.id, '42');
});

test('ScreenScraper names, synopsis, dates, credits and media normalize from API shape', () => {
  const game = normalizeScreenScraperGame({
    id: 123, nom: 'Biohazard 2',
    noms: { nom_cn: '生化危机 2', nom_jp: 'バイオハザード2', nom_us: 'Resident Evil 2' },
    dates: { date_jp: '1998-01-29', date_us: '1998-01-21' },
    developpeur: 'Capcom', editeur: 'Capcom',
    synopsis: { synopsis_zhcn: '中文简介', synopsis_en: 'English synopsis' },
    medias: { media_box2d: [{ url: 'https://example.test/box.png' }], media_screenshot: [{ url: 'https://example.test/shot.png' }] },
    systeme: { id: '1', nom: 'PlayStation' },
  });
  assert.equal(game.title, '生化危机 2');
  assert.equal(game.localizedName, '生化危机 2');
  assert.equal(game.originalName, 'Biohazard 2');
  assert.equal(game.description, '中文简介');
  assert.equal(game.cover, 'https://example.test/box.png');
  assert.deepEqual(game.screenshots, ['https://example.test/shot.png']);
  assert.deepEqual(game.platforms, ['PlayStation']);
  assert.equal(game.sources.screenscraper.systemId, '1');
});

test('same-title localized/alias records merge, but different release years stay distinct', () => {
  const rawg = normalizeRawgGame({ id: 1, name: 'Resident Evil 2', name_original: 'Resident Evil 2', released: '1998-01-21', platforms: [{ platform: { name: 'PlayStation' } }] });
  const ss = normalizeScreenScraperGame({ id: 9, nom: 'Biohazard 2', noms: { nom_jp: 'バイオハザード2', nom_cn: '生化危机 2' }, dates: { date: '1998-01-29' }, systeme: { id: 1, nom: 'PlayStation' }, developpeur: 'Capcom' });
  assert.equal(areSameGame(rawg, ss), true);
  const merged = combineCandidates([rawg], [ss]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].sources.rawg.id, '1');
  assert.equal(merged[0].sources.screenscraper.id, '9');
  assert.equal(merged[0].localizedName, '生化危机 2');

  const remake = { ...ss, releaseDate: '2019-01-25' };
  assert.equal(areSameGame(rawg, remake), false);
  assert.equal(combineCandidates([rawg], [remake]).length, 2);
});

test('secondary provider fills missing fields but does not replace primary data', () => {
  const primary = { title: 'Example', localizedName: '', cover: '', description: 'Existing', sources: { rawg: { id: '1' } }, fieldSources: {} };
  const secondary = { title: '例子', localizedName: '例子', cover: 'cover', description: 'Replacement', sources: { screenscraper: { id: '2' } }, fieldSources: {} };
  const result = mergeMetadata(primary, secondary);
  assert.equal(result.localizedName, '例子');
  assert.equal(result.cover, 'cover');
  assert.equal(result.description, 'Existing');
  assert.equal(result.fieldSources.cover, 'screenscraper');
});

test('ScreenScraper search accepts its wrapped JSON list response', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ response: { jeux: { jeu: [
    { id: '7', nom: 'Example', systeme: { id: '1', nom: 'PC-98' }, dates: { date_jp: '1992-01-01' } },
  ] } } });
  try {
    const results = await new ScreenScraperProvider({ SCREENSCRAPER_DEV_ID: 'dev', SCREENSCRAPER_DEV_PASSWORD: 'pass' }).search('Example');
    assert.equal(results.length, 1);
    assert.equal(results[0].sources.screenscraper.id, '7');
    assert.equal(results[0].platforms[0], 'PC-98');
  } finally { globalThis.fetch = originalFetch; }
});
