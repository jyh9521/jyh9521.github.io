'use client';

import { gameStoreLabels, type GamePlatform } from '../../lib/game-types';

type Props = { gameTitle: string; status?: string; platform: GamePlatform; compact?: boolean };

export default function GamePlatformCard({ gameTitle, status = '', platform, compact = false }: Props) {
  const family = platform.store;
  const platformName = platform.platform || gameStoreLabels[family];
  const igdbUrl = `https://www.igdb.com/search?type=1&q=${encodeURIComponent(gameTitle)}`;
  const catalogUrl = /^https:\/\/(?:www\.)?igdb\.com\/games\/[a-z0-9-]+\/?$/i.test(platform.catalogUrl) ? platform.catalogUrl : igdbUrl;

  return <article className={`game-platform-card${compact ? ' is-compact' : ''}`}>
    <div className="game-platform-art">
      {platform.cover ? <img src={platform.cover} alt={`${gameTitle} 封面`} loading="lazy" /> : <span aria-hidden="true">🎮</span>}
    </div>
    <div className="game-platform-copy">
      <div className="game-platform-heading"><strong>{gameTitle}</strong>{status && <span className="game-status-pill">{status}</span>}</div>
      <p className="game-platform-specs">{[platformName, platform.releaseDate, platform.genres.slice(0, 2).join(' / ')].filter(Boolean).join(' · ') || gameStoreLabels[family]}</p>
      {(platform.developer || platform.publisher) && <p className="game-platform-credit">{[platform.developer, platform.publisher].filter(Boolean).join(' · ')}</p>}
      <a className={`game-platform-link game-platform-link-${family}`} href={catalogUrl} target="_blank" rel="noreferrer">在 IGDB 查看 ↗</a>
    </div>
  </article>;
}
