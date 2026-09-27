'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkSteamCards } from './steam-markdown';
import { SteamHoverLink, SteamProductCard } from './steam-product';
import { remarkHeadingIds, type ArticleImage, type HeadingItem } from './markdown-utils';

type Props = { body: string; headings: HeadingItem[]; images: ArticleImage[]; cover?: ArticleImage; audio?: string; video?: string; attachment?: string };

export default function PostContent({ body, headings, images, cover, audio, video, attachment }: Props) {
  const [tocOpen, setTocOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);
  const galleryImages = cover ? [cover, ...images] : images;
  const galleryOffset = cover ? 1 : 0;
  let imageCursor = 0;

  useEffect(() => {
    if (activeImage === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveImage(null);
      if (event.key === 'ArrowRight') setActiveImage(index => index === null ? null : (index + 1) % galleryImages.length);
      if (event.key === 'ArrowLeft') setActiveImage(index => index === null ? null : (index - 1 + galleryImages.length) % galleryImages.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [activeImage, galleryImages.length]);

  const currentImage = activeImage === null ? null : galleryImages[activeImage];
  const markdownComponents = {
    img: ({ src, alt, title }: { src?: string; alt?: string; title?: string }) => {
      const index = imageCursor++ + galleryOffset;
      const image = images[index];
      const imageSrc = src || image?.src || '';
      const caption = title || image?.caption || alt || image?.alt || '';
      return <button type="button" className="article-image-button" onClick={() => setActiveImage(index)} aria-label={`放大图片：${caption || `第 ${index + 1} 张`}`}>
        <img src={imageSrc} alt={alt || image?.alt || ''} loading="lazy" />
        {caption && <span className="article-image-caption">{caption}</span>}
      </button>;
    },
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props}>{children}</h1>,
    a: ({ href = '', children }: { href?: string; children?: React.ReactNode }) => {
      const card = href.match(/^https:\/\/steam-card\.invalid\/app\/(\d{1,12})$/);
      if (card) return <SteamProductCard appid={card[1]} />;
      let steamApp = '';
      try { const url = new URL(href); if (/(^|\.)store\.steampowered\.com$/i.test(url.hostname)) steamApp = url.pathname.match(/^\/app\/(\d+)/)?.[1] || ''; } catch { /* Ignore malformed external links. */ }
      return steamApp ? <SteamHoverLink appid={steamApp} href={href}>{children}</SteamHoverLink> : <a href={href}>{children}</a>;
    },
  };

  return <>
    {cover && <button type="button" className="article-cover-button" onClick={() => setActiveImage(0)} aria-label={`放大封面图片：${cover.caption}`}>
      <img className="cover" src={cover.src} alt={cover.alt} /><span className="article-image-caption">{cover.caption}</span>
    </button>}
    <div className="article-content">
      {headings.length > 0 && <nav className={`post-toc${tocOpen ? ' is-open' : ''}`} aria-label="文章目录">
        <button className="toc-toggle" type="button" aria-expanded={tocOpen} onClick={() => setTocOpen(open => !open)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg><span>文章目录</span>
        </button>
        <ol className="post-toc-list">{headings.map(heading => <li key={heading.id} className={`toc-level-${heading.level}`}>
          <a href={`#${encodeURIComponent(heading.id)}`} onClick={() => setTocOpen(false)}>{heading.text}</a>
        </li>)}</ol>
      </nav>}
      <div className="body"><ReactMarkdown remarkPlugins={[remarkGfm, remarkHeadingIds, remarkSteamCards]} components={markdownComponents}>{body}</ReactMarkdown></div>
      {audio && <section className="media"><h2>音频</h2><audio controls src={audio} /></section>}
      {video && <section className="media"><h2>视频</h2><video controls src={video} /></section>}
      {attachment && <p className="media"><a href={attachment} download>下载附件 ↗</a></p>}
    </div>
    {currentImage && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="文章图片浏览器" onClick={() => setActiveImage(null)} onTouchStart={event => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={event => {
      if (touchStart.current === null) return;
      const delta = event.changedTouches[0].clientX - touchStart.current;
      if (Math.abs(delta) > 48) setActiveImage(index => index === null ? null : (index + (delta < 0 ? 1 : -1) + galleryImages.length) % galleryImages.length);
      touchStart.current = null;
    }}>
      <button className="lightbox-close" type="button" aria-label="关闭图片浏览器" onClick={() => setActiveImage(null)}><span aria-hidden="true">×</span></button>
      {galleryImages.length > 1 && <button className="lightbox-arrow lightbox-prev" type="button" aria-label="上一张图片" onClick={event => { event.stopPropagation(); setActiveImage(index => index === null ? null : (index - 1 + galleryImages.length) % galleryImages.length); }}>‹</button>}
      <div className="lightbox-content" onClick={event => event.stopPropagation()}>
        <img src={currentImage.src} alt={currentImage.alt} />
        {currentImage.caption && <p className="lightbox-caption">{currentImage.caption}</p>}
        <span className="lightbox-count">{activeImage! + 1} / {galleryImages.length}</span>
      </div>
      {galleryImages.length > 1 && <button className="lightbox-arrow lightbox-next" type="button" aria-label="下一张图片" onClick={event => { event.stopPropagation(); setActiveImage(index => index === null ? null : (index + 1) % galleryImages.length); }}>›</button>}
    </div>}
  </>;
}
