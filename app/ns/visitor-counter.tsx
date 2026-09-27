'use client';

import { useEffect, useState } from 'react';

export default function NsVisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/ns/api/counter', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Counter request failed');
        return response.json() as Promise<{ count: number }>;
      })
      .then((data) => setCount(data.count))
      .catch(() => setCount(null));
  }, []);

  return <strong className="ns-counter-number" aria-live="polite">{count === null ? '—' : count.toLocaleString()}</strong>;
}
