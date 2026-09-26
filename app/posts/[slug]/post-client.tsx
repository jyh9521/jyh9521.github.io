'use client';
import Link from 'next/link';
import { useTina } from 'tinacms/dist/react';
import { TinaMarkdown } from 'tinacms/dist/rich-text';

export default function PostClient(props: { data: any; query: string; variables: object }) {
  const { data } = useTina(props);
  const post = data.post;
  return <main className="container article"><Link className="back" href="/">← 返回首页</Link><time>{String(post.date || '').slice(0, 10)}</time><h1>{post.title}</h1>{post.description && <p className="intro">{post.description}</p>}{post.cover && <img className="cover" src={post.cover} alt="" />}<div className="body"><TinaMarkdown content={post.body} /></div>{post.audio && <section className="media"><h2>音频</h2><audio controls src={post.audio} /></section>}{post.video && <section className="media"><h2>视频</h2><video controls src={post.video} /></section>}{post.attachment && <p className="media"><a href={post.attachment} download>下载附件 ↗</a></p>}</main>;
}
