'use client';

import { gameStoreLabels, type GamePlatform } from '../../lib/game-types';
import { SteamProductCard } from '../posts/steam-product';

type Props = { gameTitle: string; status?: string; platform: GamePlatform; compact?: boolean };

export default function GamePlatformCard({ gameTitle, status = '', platform, compact = false }: Props) {
  const steamId = platform.store === 'steam' && /^\d{1,12}$/.test(platform.storeId) ? platform.storeId : '';
  const storeUrl = /^https?:\/\//i.test(platform.storeUrl) ? platform.storeUrl : '';

  return <article className={`game-platform-card${compact ? ' is-compact' : ''}`}>
    {steamId ? <SteamProductCard appid={steamId} name={gameTitle} status={status} /> : <>
      <div className="game-platform-art">
        {platform.cover ? <img src={platform.cover} alt={`${gameTitle} 封面`} loading="lazy" /> : <span aria-hidden="true">🎮</span>}
      </div>
      <div className="game-platform-copy">
        <div className="game-platform-heading"><strong>{gameTitle}</strong>{status && <span className="game-status-pill">{status}</span>}</div>
        <p className="game-platform-specs">{[platform.platform, platform.region, platform.releaseDate, platform.genres.slice(0, 2).join(' / ')].filter(Boolean).join(' · ') || gameStoreLabels[platform.store]}</p>
        {platform.description && <p className="game-platform-description">{platform.description}</p>}
        {(platform.developer || platform.publisher) && <p className="game-platform-credit">{[platform.developer, platform.publisher].filter(Boolean).join(' · ')}</p>}
        {storeUrl ? <a className="game-platform-link" href={storeUrl} target="_blank" rel="noreferrer">在{gameStoreLabels[platform.store]}查看 ↗</a> : <span className="game-platform-no-link">暂无商店页面 · 可作为实体/历史游戏档案收录</span>}
      </div>
    </>}
  </article>;
}
