import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkSteamCards } from '../steam-markdown';
import { SteamHoverLink, SteamProductCard } from '../steam-product';
import { getAllPosts, getPost, hasLocalAsset } from '../../../lib/posts';

export function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }));
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  return <main className="article-shell">
    <div className="container article">
      <Link className="back" href="/">← 返回文章列表</Link>
      <header className="article-header">
        <div className="post-meta"><time>{post.date.slice(0, 10)}</time><span className="meta-line" />{post.tags?.[0] || '博客'}</div>
        <h1>{post.title}</h1>
        {post.description && <p className="intro">{post.description}</p>}
      </header>
      {hasLocalAsset(post.cover) && <img className="cover" src={post.cover} alt="" />}
      <div className="article-content"><div className="body"><ReactMarkdown remarkPlugins={[remarkGfm, remarkSteamCards]} components={{
        img: ({ src, alt, title }) => <span className="article-image"><img src={src || ''} alt={alt || ''} /><span className="article-image-caption">{title || alt}</span></span>,
        a: ({ href = '', children }) => {
          const card = href.match(/^https:\/\/steam-card\.invalid\/app\/(\d{1,12})$/);
          if (card) return <SteamProductCard appid={card[1]} />;
          let steamApp = '';
          try { const url = new URL(href); if (/(^|\.)store\.steampowered\.com$/i.test(url.hostname)) steamApp = url.pathname.match(/^\/app\/(\d+)/)?.[1] || ''; } catch {}
          return steamApp ? <SteamHoverLink appid={steamApp} href={href}>{children}</SteamHoverLink> : <a href={href}>{children}</a>;
        },
      }}>{post.body}</ReactMarkdown></div>
        {post.audio && <section className="media"><h2>音频</h2><audio controls src={post.audio} /></section>}
        {post.video && <section className="media"><h2>视频</h2><video controls src={post.video} /></section>}
        {post.attachment && <p className="media"><a href={post.attachment} download>下载附件 ↗</a></p>}
      </div>
      <Link className="article-end" href="/">← 查看更多文章</Link>
    </div>
  </main>;
}
