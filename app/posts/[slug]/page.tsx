import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAllPosts, getPost } from '../../../lib/posts';

export function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }));
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  return <main className="container article"><Link className="back" href="/">← 返回首页</Link><time>{post.date.slice(0, 10)}</time><h1>{post.title}</h1>{post.description && <p className="intro">{post.description}</p>}{post.cover && <img className="cover" src={post.cover} alt="" />}<div className="body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown></div>{post.audio && <section className="media"><h2>音频</h2><audio controls src={post.audio} /></section>}{post.video && <section className="media"><h2>视频</h2><video controls src={post.video} /></section>}{post.attachment && <p className="media"><a href={post.attachment} download>下载附件 ↗</a></p>}</main>;
}
