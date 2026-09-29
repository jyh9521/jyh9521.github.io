export type VisitStats = { pageViews: number; uniqueVisitors: number };

let inFlight: { pathname: string; request: Promise<VisitStats> } | null = null;

function createVisitorId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function getVisitorId() {
  try {
    const key = 'blog-visitor-id';
    const existing = localStorage.getItem(key);
    if (existing && /^[\w-]{16,128}$/.test(existing)) return existing;
    const id = createVisitorId();
    localStorage.setItem(key, id);
    return id;
  } catch {
    return createVisitorId();
  }
}

export function recordVisit(pathname: string): Promise<VisitStats> {
  if (inFlight?.pathname === pathname) return inFlight.request;
  const request = fetch('/ns/api/counter', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId: getVisitorId() }),
  }).then(async response => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '访客统计请求失败');
    return data as VisitStats;
  });
  inFlight = { pathname, request };
  request.finally(() => { if (inFlight?.request === request) inFlight = null; }).catch(() => undefined);
  return request;
}
