import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { GameEvent, GamePlatform, GameRecord, GameStore } from './game-types';

const gamesDir = path.join(process.cwd(), 'content/games');
const stores = new Set<GameStore>(['steam', 'playstation', 'xbox', 'nintendo']);
const asText = (value: unknown) => String(value ?? '').trim();
const asDate = (value: unknown) => value instanceof Date ? value.toISOString().slice(0, 10) : asText(value).slice(0, 10);

function parsePlatform(record: any): GamePlatform | null {
  const store = asText(record?.store).toLowerCase() as GameStore;
  if (!stores.has(store)) return null;
  const storeUrl = asText(record.storeUrl);
  const safeUrl = /^https?:\/\//i.test(storeUrl) ? storeUrl : '';
  return {
    store,
    platform: asText(record.platform),
    region: asText(record.region),
    storeId: asText(record.storeId),
    storeUrl: safeUrl,
    cover: asText(record.cover),
    description: asText(record.description),
    developer: asText(record.developer),
    publisher: asText(record.publisher),
    releaseDate: asDate(record.releaseDate),
    genres: Array.isArray(record.genres) ? record.genres.map(asText).filter(Boolean) : [],
    catalogSource: asText(record.catalogSource),
    catalogId: asText(record.catalogId),
  };
}

export function getGames(): GameRecord[] {
  if (!fs.existsSync(gamesDir)) return [];
  return fs.readdirSync(gamesDir).filter(file => /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(file)).flatMap(file => {
    const slug = file.slice(0, -3);
    const { data } = matter(fs.readFileSync(path.join(gamesDir, file), 'utf8'));
    if (!data.title) return [];

    const platforms = Array.isArray(data.platforms) ? data.platforms.map(parsePlatform).filter((item): item is GamePlatform => Boolean(item)) : [];
    // Read old Steam-only records so existing dossiers keep working during/after migration.
    if (!platforms.length && /^\d{1,12}$/.test(asText(data.appid))) platforms.push({
      store: 'steam', platform: 'PC', region: 'Global', storeId: asText(data.appid),
      storeUrl: `https://store.steampowered.com/app/${asText(data.appid)}/`, cover: '', description: '',
      developer: '', publisher: '', releaseDate: '', genres: [], catalogSource: '', catalogId: '',
    });

    const events = Array.isArray(data.events) ? data.events.filter((event: any) => event?.title).map((event: any) => ({
      date: asDate(event.date), title: asText(event.title), note: asText(event.note),
    })).sort((a: GameEvent, b: GameEvent) => b.date.localeCompare(a.date)) : [];
    return [{ slug, title: asText(data.title), status: asText(data.status) || '想玩', summary: asText(data.summary), platforms, events }];
  }).sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
}

export function getGame(slug: string) { return getGames().find(game => game.slug === slug) || null; }
