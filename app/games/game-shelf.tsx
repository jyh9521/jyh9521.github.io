import Link from 'next/link';
import type { GameRecord } from '../../lib/games';
import { SteamProductCard } from '../posts/steam-product';

export default function GameShelf({ games }: { games: GameRecord[] }) {
  if (!games.length) return <p className="empty-posts">还没有游戏档案，之后可在 Sveltia 后台添加。</p>;
  return <div className="game-shelf">{games.map(game => <article className="game-shelf-item" key={game.slug}>
    <div className="game-shelf-title"><Link href={`/games/${game.slug}/`}>{game.title} ↗</Link><span>{game.status}</span></div>
    <SteamProductCard appid={game.appid} name={game.title} status={game.status} />
    <p>{game.summary}</p>
  </article>)}</div>;
}
