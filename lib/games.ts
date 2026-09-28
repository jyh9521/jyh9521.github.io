import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { GameEvent, GamePlatform, GameRecord, GameStore } from './game-types';

const gamesDir = path.join(process.cwd(), 'content/games');
const stores = new Set<GameStore>(['pc', 'playstation', 'xbox', 'nintendo']);
const asText = (value: unknown) => String(value ?? '').trim();
const asDate = (value: unknown) => value instanceof Date
  ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value)
  : asText(value).slice(0, 10);

function parsePlatform(record: any, igdbGame: any = {}) : GamePlatform | null {
  const choice = record?.platformChoice || {};
  const selectedFamily = asText(choice.family).toLowerCase();
  const family = selectedFamily === 'steam' ? 'pc' : selectedFamily;
  const legacyStore = asText(record?.store).toLowerCase();
  const store = (family || (legacyStore === 'steam' ? 'pc' : legacyStore)) as GameStore;
  if (!stores.has(store)) return null;
  const metadata = { ...igdbGame, ...(record?.metadata || {}), ...record };
  const igdbId = asText(metadata.igdbId || igdbGame.igdbId);
  const metadataSource = igdbId ? 'IGDB' : asText(metadata.catalogSource);
  const igdbSlug = asText(metadata.slug || igdbGame.slug);
  const selectedPlatform = asText(choice.platform || record.platform);
  const platform = /^steam$/i.test(selectedPlatform) ? 'PC' : selectedPlatform;
  return {
    store,
    platform,
    catalogUrl: igdbSlug ? `https://www.igdb.com/games/${encodeURIComponent(igdbSlug)}` : '',
    cover: asText(metadata.cover),
    description: asText(metadata.description),
    developer: asText(metadata.developer),
    publisher: asText(metadata.publisher),
    releaseDate: asDate(metadata.releaseDate),
    genres: Array.isArray(metadata.genres) ? metadata.genres.map(asText).filter(Boolean) : [],
    catalogSource: metadataSource,
    catalogId: igdbId,
  };
}

export function getGames(): GameRecord[] {
  if (!fs.existsSync(gamesDir)) return [];
  return fs.readdirSync(gamesDir).filter(file => /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(file)).flatMap(file => {
    const slug = file.slice(0, -3);
    const { data } = matter(fs.readFileSync(path.join(gamesDir, file), 'utf8'));
    const igdbGame = data.igdbGame && typeof data.igdbGame === 'object' ? data.igdbGame : {};
    if (!data.title && !igdbGame.title) return [];
    const platformRecords = Array.isArray(data.platforms) ? data.platforms : [];
    const platforms = platformRecords.map(record => parsePlatform(record, igdbGame)).filter((item): item is GamePlatform => Boolean(item));
    if (Array.isArray(igdbGame.platforms)) for (const name of igdbGame.platforms.map(asText).filter(Boolean)) {
      if (platforms.some(platform => platform.platform.toLocaleLowerCase() === name.toLocaleLowerCase())) continue;
      const normalized = name.toLowerCase();
      const family: GameStore = /playstation|ps[1-5]|psp|vita/.test(normalized) ? 'playstation' : /xbox/.test(normalized) ? 'xbox' : /nintendo|switch|wii|game ?boy|3ds|ds/.test(normalized) ? 'nintendo' : 'pc';
      platforms.push(parsePlatform({ platformChoice: { family, platform: name } }, igdbGame)!);
    }
    // Read old Steam-only records so existing dossiers keep working during/after migration.
    const events = Array.isArray(data.events) ? data.events.filter((event: any) => event?.title).map((event: any) => ({
      date: asDate(event.date), title: asText(event.title), note: asText(event.note),
    })).sort((a: GameEvent, b: GameEvent) => b.date.localeCompare(a.date)) : [];
    return [{ slug, title: asText(data.title || igdbGame.title), status: asText(data.status) || '想玩', summary: asText(data.summary || igdbGame.description), platforms, events }];
  }).sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
}

export function getGame(slug: string) { return getGames().find(game => game.slug === slug) || null; }
