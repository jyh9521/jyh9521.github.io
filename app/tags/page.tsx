import Link from 'next/link';
import { getAllPosts } from '../../lib/posts';

export const metadata = { title: '标签' };

export default function TagsPage() {
  const counts = new Map<string, number>();
  getAllPosts().forEach(post => post.tags.forEach(tag => counts.set(tag, (counts.get(tag) || 0) + 1)));
  const tags = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'));
  return <main className="article-shell"><div className="container tags-page"><span className="section-kicker">EXPLORE BY TAG</span><h1>标签</h1><p>按主题探索文章，数字表示包含该标签的文章数量。</p><div className="tag-cloud">{tags.map(([tag, count]) => <Link key={tag} href={`/posts/?tag=${encodeURIComponent(tag)}`}><span>{tag}</span><small>{count}</small></Link>)}</div></div></main>;
}
