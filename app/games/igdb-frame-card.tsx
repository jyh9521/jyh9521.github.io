'use client';

import { useEffect, useState } from 'react';
import GamePlatformCard from './game-platform-card';
import type { GamePlatform, GameStore } from '../../lib/game-types';

type Game = { id: string; slug: string; title: string; cover: string; releaseDate: string; developer: string; platforms: string[]; description: string };
const families: Record<string, GameStore> = { p: 'playstation', n: 'nintendo', x: 'xbox', s: 'pc' };

export default function IgdbFrameCard({ frame, id, title = '', status = '' }: { frame: string; id: string; title?: string; status?: string }) {
  const [game, setGame] = useState<Game | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const requestGame = async (gameId: string) => {
      const response = await fetch(`https://blog.blfy.cc/ns/api/igdb/game?id=${encodeURIComponent(gameId)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'IGDB 游戏资料读取失败');
      return body;
    };
    requestGame(id).catch(async error => {
      if (!title) throw error;
      const response = await fetch(`https://blog.blfy.cc/ns/api/igdb/search?q=${encodeURIComponent(title)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || String(error));
      const normalized = title.trim().toLocaleLowerCase();
      const candidate = (result.results || []).find((item: Game) => item.title.trim().toLocaleLowerCase() === normalized);
      if (!candidate) throw error;
      return requestGame(candidate.id);
    })
      .then(data => { if (active) setGame(data); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [id, title]);

  const family = families[frame] || 'pc';
  const target = game?.title || title || `IGDB ${id}`;
  const fallback = `https://www.igdb.com/search?type=1&q=${encodeURIComponent(target)}`;
  if (!game) return <span className={`game-frame-placeholder${failed ? ' is-error' : ''}`}>
    <span className="game-frame-placeholder-copy"><strong>{failed ? `IGDB 游戏资料暂不可用（${id}）` : `正在读取 IGDB 游戏资料（${id}）…`}</strong>{status && <small className="game-frame-status">{status}</small>}</span>
    <a className={`game-frame-cta game-platform-link-${family}`} href={fallback} target="_blank" rel="noreferrer">在 IGDB 查看 ↗</a>
  </span>;

  const platformName = game.platforms.find(name => frame === 'p' ? /playstation|ps[1-5]|vita|psp/i.test(name) : frame === 'n' ? /nintendo|switch|wii|3ds|game boy|ds/i.test(name) : frame === 'x' ? /xbox/i.test(name) : /windows|pc|mac|linux/i.test(name)) || game.platforms[0] || (family === 'pc' ? 'PC' : '');
  const platform: GamePlatform = {
    store: family, platform: platformName,
    catalogUrl: game.slug ? `https://www.igdb.com/games/${game.slug}` : '', cover: game.cover,
    description: game.description, developer: game.developer, publisher: '', releaseDate: game.releaseDate,
    genres: [], catalogSource: 'IGDB', catalogId: game.id,
  };
  return <GamePlatformCard gameTitle={title || game.title} status={status} platform={platform} />;
}
