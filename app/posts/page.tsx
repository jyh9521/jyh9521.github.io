import ArchiveSearch from './archive-search';
import { getAllPosts } from '../../lib/posts';

export const metadata = { title: '文章' };

export default function PostsPage() {
  const posts = getAllPosts();
  return <main className="article-shell archive-shell">
    <div className="container archive-page">
      <div className="section-title"><div><span className="section-kicker">EXPLORE</span><h1>文章</h1></div><span className="article-count">共 {posts.length} 篇</span></div>
      <ArchiveSearch posts={posts} />
    </div>
  </main>;
}
