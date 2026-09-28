import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts } from '../../../lib/posts';
import { getGame, getGames } from '../../../lib/games';
import GamePlatformSelector from '../game-platform-selector';

export function generateStaticParams() { return getGames().map(game => ({ slug: game.slug })); }
export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();
  const posts = getAllPosts().filter(post => post.gameSlug === slug);
  return <main className="article-shell"><div className="container game-detail">
    <Link className="back" href="/games/">← 返回游戏档案</Link>
    <header className="article-header"><span className="section-kicker">GAME DOSSIER</span><h1>{game.title}</h1><p className="intro">{game.summary}</p><span className="game-status-pill">{game.status}</span></header>
    <GamePlatformSelector title={game.title} status={game.status} platforms={game.platforms} detailHref={`/games/${game.slug}/`} />
    {game.events.length > 0 && <section className="game-timeline"><h2>游玩与制作时间线</h2><ol>{[...game.events].reverse().map((event, index) => <li key={`${event.date}-${event.title}-${index}`}><time>{event.date || '日期未记录'}</time><strong>{event.title}</strong>{event.note && <p>{event.note}</p>}</li>)}</ol></section>}
    {posts.length > 0 && <section className="game-related"><h2>相关博客文章</h2><div className="related-grid">{posts.map(post => <Link key={post.slug} className="related-card" href={`/posts/${post.slug}/`}><span>{post.tags.join(' · ')}</span><strong>{post.title}</strong><small>{post.date.slice(0, 10)} · 阅读文章 →</small></Link>)}</div></section>}
  </div></main>;
}
