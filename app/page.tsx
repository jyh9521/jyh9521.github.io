import Link from 'next/link';
import { getAllPosts } from '../lib/posts';

export default function Home() {
  const posts = getAllPosts();
  return <main className="container"><section className="hero"><span className="eyebrow">PERSONAL JOURNAL</span><h1>记录所见，<br/>分享所想。</h1><p>欢迎来到 BLFY 的个人博客！</p></section><section><div className="section-title"><h2>最近文章</h2><span>{posts.length} 篇</span></div>{posts.length ? <div className="post-list">{posts.map(post => <article key={post.slug} className="post-card"><time>{post.date.slice(0, 10)}</time><h3><Link href={`/posts/${post.slug}/`}>{post.title}</Link></h3><p>{post.description}</p><span>{post.tags.join(' · ')}</span></article>)}</div> : <p>文章即将发布。</p>}</section></main>;
}
