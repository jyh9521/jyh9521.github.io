'use client';

import { gameStoreLabels, type GamePlatform } from '../../lib/game-types';

type Props = { gameTitle: string; status?: string; platform: GamePlatform; compact?: boolean; detailHref?: string };

export default function GamePlatformCard({ gameTitle, status = '', platform, compact = false, detailHref }: Props) {
  const family = platform.store === 'steam' ? 'pc' : platform.store;
  const storeUrl = /^https?:\/\//i.test(platform.storeUrl) ? platform.storeUrl : '';
  const platformName = platform.platform || gameStoreLabels[family];
  const isIgdb = Boolean(platform.catalogUrl || platform.catalogSource.toLowerCase().includes('igdb') || platform.catalogId);
  const igdbUrl = `https://www.igdb.com/search?type=1&q=${encodeURIComponent(gameTitle)}`;
  const fallbackUrl = isIgdb ? (/^https:\/\/(?:www\.)?igdb\.com\//i.test(platform.catalogUrl) ? platform.catalogUrl : igdbUrl) : detailHref || '/games/';
  const linkText = storeUrl
    ? family === 'playstation' ? '在PlayStation查看 ↗'
      : family === 'xbox' ? '在Xbox查看 ↗'
        : family === 'nintendo' ? '在Nintendo查看 ↗'
          : `在${platformName}查看 ↗`
    : isIgdb ? '在IGDB查看 ↗' : '查看游戏资料 ↗';

  return <article className={`game-platform-card${compact ? ' is-compact' : ''}`}>
    <div className="game-platform-art">
      {platform.cover ? <img src={platform.cover} alt={`${gameTitle} 封面`} loading="lazy" /> : <span aria-hidden="true">🎮</span>}
    </div>
    <div className="game-platform-copy">
      <div className="game-platform-heading"><strong>{gameTitle}</strong>{status && <span className="game-status-pill">{status}</span>}</div>
      <p className="game-platform-specs">{[platformName, platform.region, platform.releaseDate, platform.genres.slice(0, 2).join(' / ')].filter(Boolean).join(' · ') || gameStoreLabels[family]}</p>
      {(platform.developer || platform.publisher) && <p className="game-platform-credit">{[platform.developer, platform.publisher].filter(Boolean).join(' · ')}</p>}
      <a className={`game-platform-link game-platform-link-${family}`} href={storeUrl || fallbackUrl} target={storeUrl || isIgdb ? '_blank' : undefined} rel={storeUrl || isIgdb ? 'noreferrer' : undefined}>{linkText}</a>
      {platform.catalogSource.toLowerCase().includes('ntprices') && /^https:\/\/ntprices\.com\//i.test(platform.catalogUrl) && <small><a href={platform.catalogUrl} target="_blank" rel="noreferrer">资料由 NTPrices 提供 ↗</a></small>}
    </div>
  </article>;
}
