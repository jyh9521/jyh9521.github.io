import Link from 'next/link';
import type { GameRecord } from '../../lib/game-types';
import GamePlatformCard from './game-platform-card';
import { gameStoreLabels } from '../../lib/game-types';

export default function GameShelf({ games, variant = 'directory' }: { games: GameRecord[]; variant?: 'home' | 'directory' }) {
  if (!games.length) return <p className="empty-posts">还没有游戏档案，之后可在 Sveltia 后台添加。</p>;
  if (variant === 'home') return <div className="game-shelf game-shelf-home">{games.map(game => {
    const cover = game.platforms.find(platform => platform.cover)?.cover || game.metadata?.cover || '';
    const platformNames = [...new Set(game.platforms.map(platform => `${gameStoreLabels[platform.store]} · ${platform.platform}`))];
    const family = game.platforms[0]?.store || 'pc';
    return <article className="game-shelf-home-item" key={game.slug}>
      <div className="game-shelf-home-copy">
        <div className="game-shelf-title"><Link href={`/games/${game.slug}/`}>{game.title} ↗</Link><span>{game.status}</span></div>
        {game.summary && <p>{game.summary}</p>}
        {platformNames.length > 0 && <div className="game-shelf-platforms">{platformNames.map(label => <span key={label}>{label}</span>)}</div>}
        <Link className={`game-platform-link game-platform-link-${family}`} href={`/games/${game.slug}/`}>查看游戏档案 ↗</Link>
      </div>
      <Link className="game-shelf-home-art" href={`/games/${game.slug}/`} aria-label={`查看${game.title}档案`}>
        {cover ? <img src={cover} alt={`${game.title} 封面`} loading="lazy" /> : <span aria-hidden="true">🎮</span>}
      </Link>
    </article>;
  })}</div>;
  return <div className="game-shelf">{games.map(game => <article className="game-shelf-item" key={game.slug}>
    <div className="game-shelf-title"><Link href={`/games/${game.slug}/`}>{game.title} ↗</Link><span>{game.status}</span></div>
    {game.platforms[0] && <GamePlatformCard gameTitle={game.title} status={game.status} platform={game.platforms[0]} manual={game.manual} compact />}
    <div className="game-shelf-platforms">{[...new Set(game.platforms.map(platform => `${gameStoreLabels[platform.store]} · ${platform.platform}`))].map(label => <span key={label}>{label}</span>)}</div>
    <p>{game.summary}</p>
  </article>)}</div>;
}
