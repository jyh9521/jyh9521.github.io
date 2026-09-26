import Link from 'next/link';
import { client } from '../tina/__generated__/client';

export default async function Home() {
  const { data } = await client.queries.postConnection();
  const posts = (data.postConnection.edges || []).flatMap(edge => edge?.node ? [edge.node] : []).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  return <main className="container"><section className="hero"><span className="eyebrow">PERSONAL JOURNAL</span><h1>记录所见，<br/>分享所想。</h1><p>欢迎来到 BLFY 的个人博客！</p></section><section><div className="section-title"><h2>最近文章</h2><span>{posts.length} 篇</span></div>{posts.length ? <div className="post-list">{posts.map(post => <article key={post._sys.filename} className="post-card"><time>{String(post.date || '').slice(0, 10)}</time><h3><Link href={`/posts/${post._sys.filename}/`}>{post.title}</Link></h3><p>{post.description}</p><span>{post.tags?.filter(Boolean).join(' · ')}</span></article>)}</div> : <p>文章即将发布。</p>}</section></main>;
}
