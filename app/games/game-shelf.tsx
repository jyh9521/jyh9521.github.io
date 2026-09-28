import Link from 'next/link';
import type { GameRecord } from '../../lib/game-types';
import GamePlatformCard from './game-platform-card';
import { gameStoreLabels } from '../../lib/game-types';

export default function GameShelf({ games }: { games: GameRecord[] }) {
  if (!games.length) return <p className="empty-posts">还没有游戏档案，之后可在 Sveltia 后台添加。</p>;
  return <div className="game-shelf">{games.map(game => <article className="game-shelf-item" key={game.slug}>
    <div className="game-shelf-title"><Link href={`/games/${game.slug}/`}>{game.title} ↗</Link><span>{game.status}</span></div>
    {game.platforms[0] && <GamePlatformCard gameTitle={game.title} status={game.status} platform={game.platforms[0]} compact />}
    <div className="game-shelf-platforms">{[...new Set(game.platforms.map(platform => `${gameStoreLabels[platform.store]} · ${platform.platform}`))].map(label => <span key={label}>{label}</span>)}</div>
    <p>{game.summary}</p>
  </article>)}</div>;
}
