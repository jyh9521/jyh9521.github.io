import Link from 'next/link';

export default function NotFound() {
  return <main className="not-found"><span className="section-kicker">404 · LOST IN THE GAME</span><div className="lost-mark" aria-hidden="true">?</div><h1>这里好像没有存档。</h1><p>你找的页面暂时不在地图上，试试回到首页或随机探索一篇文章。</p><div><Link className="hero-button" href="/">返回首页 ↗</Link><Link className="lost-link" href="/posts/">浏览文章</Link></div></main>;
}
