import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { GameEvent, GamePlatform, GameRecord, GameStore } from './game-types';

const gamesDir = path.join(process.cwd(), 'content/games');
const stores = new Set<GameStore>(['pc', 'steam', 'playstation', 'xbox', 'nintendo']);
const asText = (value: unknown) => String(value ?? '').trim();
const asDate = (value: unknown) => value instanceof Date
  ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value)
  : asText(value).slice(0, 10);

function parsePlatform(record: any): GamePlatform | null {
  const choice = record?.platformChoice || {};
  const family = asText(choice.family).toLowerCase();
  const legacyStore = asText(record?.store).toLowerCase();
  const store = (family || (legacyStore === 'steam' ? 'pc' : legacyStore)) as GameStore;
  if (!stores.has(store)) return null;
  const metadata = record?.metadata || record;
  const submittedUrl = asText(metadata.storeUrl);
  const safeSubmittedUrl = /^https:\/\//i.test(submittedUrl) ? submittedUrl : '';
  const metadataSource = asText(record.catalogSource || metadata.catalogSource);
  const isIgdbUrl = /(^|\.)igdb\.com$/i.test((() => { try { return new URL(safeSubmittedUrl).hostname; } catch { return ''; } })()) || metadataSource.toLowerCase().includes('igdb');
  const safeUrl = isIgdbUrl ? '' : safeSubmittedUrl;
  const platform = asText(choice.platform || (legacyStore === 'steam' && asText(record.platform).toLowerCase() === 'pc' ? 'Steam' : record.platform) || (store === 'steam' ? 'Steam' : ''));
  return {
    store,
    platform,
    region: asText(record.region),
    storeId: asText(record.storeId || metadata.storeId || (store === 'pc' && /^(steam|steam store)$/i.test(platform) ? safeSubmittedUrl.match(/\/app\/(\d{1,12})(?:\/|$)/)?.[1] : '')),
    storeUrl: safeUrl,
    catalogUrl: isIgdbUrl ? safeSubmittedUrl : asText(record.catalogUrl),
    cover: asText(metadata.cover),
    description: asText(metadata.description),
    developer: asText(metadata.developer),
    publisher: asText(metadata.publisher),
    releaseDate: asDate(metadata.releaseDate),
    genres: Array.isArray(metadata.genres) ? metadata.genres.map(asText).filter(Boolean) : [],
    catalogSource: metadataSource,
    catalogId: asText(record.catalogId || metadata.catalogId),
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
      store: 'pc', platform: 'Steam', region: 'Global', storeId: asText(data.appid),
      storeUrl: `https://store.steampowered.com/app/${asText(data.appid)}/`, catalogUrl: '', cover: '', description: '',
      developer: '', publisher: '', releaseDate: '', genres: [], catalogSource: '', catalogId: '',
    });

    const events = Array.isArray(data.events) ? data.events.filter((event: any) => event?.title).map((event: any) => ({
      date: asDate(event.date), title: asText(event.title), note: asText(event.note),
    })).sort((a: GameEvent, b: GameEvent) => b.date.localeCompare(a.date)) : [];
    return [{ slug, title: asText(data.title), status: asText(data.status) || '想玩', summary: asText(data.summary), platforms, events }];
  }).sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
}

export function getGame(slug: string) { return getGames().find(game => game.slug === slug) || null; }
