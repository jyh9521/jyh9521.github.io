'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { recordVisit } from '../visit-stats';

export default function NsVisitorCounter() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!pathname) return;
    let active = true;
    recordVisit(pathname)
      .then((data) => { if (active) setCount(data.pageViews); })
      .catch(() => { if (active) setCount(null); });
    return () => { active = false; };
  }, [pathname]);

  return <strong className="ns-counter-number" aria-live="polite">{count === null ? '—' : count.toLocaleString()}</strong>;
}
