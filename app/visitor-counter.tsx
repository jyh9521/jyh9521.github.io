'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** Busuanzi's self-hosted project's public demo API; re-run on client-side route changes. */
export default function VisitorCounter() {
  const pathname = usePathname();

  useEffect(() => {
    const previous = document.querySelector<HTMLScriptElement>('script[data-blog-busuanzi]');
    previous?.remove();

    const script = document.createElement('script');
    script.dataset.blogBusuanzi = 'true';
    script.src = 'https://busuanzi.9420.ltd/js';
    script.dataset.api = 'https://busuanzi.9420.ltd/api';
    script.async = true;
    document.body.appendChild(script);

    return () => script.remove();
  }, [pathname]);

  return <span className="visitor-counter" aria-label="博客访问统计">
    本站访问 <span id="busuanzi_site_pv">—</span> 次 · 访客 <span id="busuanzi_site_uv">—</span> 人
  </span>;
}
