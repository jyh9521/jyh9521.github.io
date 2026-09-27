'use client';

import { useEffect, useRef } from 'react';

const repo = 'jyh9521/myblog';
const repoId = 'R_kgDOOsUgTA';
const category = 'Announcements';
const categoryId = 'DIC_kwDOOsUgTM4DGhj1';

function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark_dimmed' : 'light';
}

export default function GiscusComments() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !categoryId) return;

    container.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.repo = repo;
    script.dataset.repoId = repoId;
    script.dataset.category = category;
    script.dataset.categoryId = categoryId;
    script.dataset.mapping = 'pathname';
    script.dataset.strict = '0';
    script.dataset.reactionsEnabled = '1';
    script.dataset.emitMetadata = '0';
    script.dataset.inputPosition = 'top';
    script.dataset.theme = currentTheme();
    script.dataset.lang = 'zh-CN';
    script.dataset.loading = 'lazy';
    container.appendChild(script);

    const observer = new MutationObserver(() => {
      const frame = container.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
      frame?.contentWindow?.postMessage({ giscus: { setConfig: { theme: currentTheme() } } }, 'https://giscus.app');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { observer.disconnect(); container.replaceChildren(); };
  }, []);

  return <section className="giscus-card" aria-label="文章评论">
    <div className="section-title"><div><span className="section-kicker">DISCUSSION</span><h2>评论与讨论</h2></div></div>
    <div ref={containerRef} className="giscus" />
  </section>;
}
