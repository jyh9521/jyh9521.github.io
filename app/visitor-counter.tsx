'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { recordVisit, type VisitStats } from './visit-stats';

export default function VisitorCounter() {
  const pathname = usePathname();
  const [stats, setStats] = useState<VisitStats | null>(null);

  useEffect(() => {
    if (!pathname) return;
    let active = true;
    recordVisit(pathname).then(value => { if (active) setStats(value); }).catch(() => { if (active) setStats(null); });
    return () => { active = false; };
  }, [pathname]);

  return <span className="visitor-counter" aria-label="博客访问统计">
    本站访问 <span>{stats?.pageViews.toLocaleString() ?? '—'}</span> 次 · 访客 <span>{stats?.uniqueVisitors.toLocaleString() ?? '—'}</span> 人
  </span>;
}
