import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const gamesDir = path.join(process.cwd(), 'content/games');
export type GameEvent = { date: string; title: string; note: string };
export type GameRecord = { slug: string; title: string; appid: string; status: string; summary: string; events: GameEvent[] };

export function getGames(): GameRecord[] {
  if (!fs.existsSync(gamesDir)) return [];
  return fs.readdirSync(gamesDir).filter(file => /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(file)).flatMap(file => {
    const slug = file.slice(0, -3);
    const { data } = matter(fs.readFileSync(path.join(gamesDir, file), 'utf8'));
    if (!data.title || !/^\d{1,12}$/.test(String(data.appid || ''))) return [];
    const eventDate = (value: unknown) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value || '').slice(0, 10);
    const events = Array.isArray(data.events) ? data.events.filter((event: any) => event?.title).map((event: any) => ({ date: eventDate(event.date), title: String(event.title), note: String(event.note || '') })).sort((a: GameEvent, b: GameEvent) => b.date.localeCompare(a.date)) : [];
    return [{ slug, title: String(data.title), appid: String(data.appid), status: String(data.status || '想玩'), summary: String(data.summary || ''), events }];
  }).sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
}

export function getGame(slug: string) { return getGames().find(game => game.slug === slug) || null; }
