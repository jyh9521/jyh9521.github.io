import type { Plugin } from 'unified';

// [sframe]323170[/sframe] becomes an internal marker link; code blocks stay untouched.
export const remarkSteamCards: Plugin = () => (tree: any) => {
  const visit = (node: any) => {
    if (!Array.isArray(node.children)) return;
    const next: any[] = [];
    for (const child of node.children) {
      if (child.type === 'text') {
        const pattern = /\[sframe\]\s*(\d{1,12})(?:\|([^|\]]*))?(?:\|([^|\]]*))?\s*\[\/sframe\]/gi;
        let last = 0;
        for (const match of child.value.matchAll(pattern)) {
          const index = match.index ?? 0;
          if (index > last) next.push({ type: 'text', value: child.value.slice(last, index) });
          next.push({ type: 'link', url: `https://steam-card.invalid/app/${match[1]}?name=${encodeURIComponent(match[2] || '')}&status=${encodeURIComponent(match[3] || '')}`, title: null, children: [{ type: 'text', value: '' }] });
          last = index + match[0].length;
        }
        if (last) {
          if (last < child.value.length) next.push({ type: 'text', value: child.value.slice(last) });
        } else next.push(child);
      } else {
        visit(child);
        next.push(child);
      }
    }
    node.children = next;
  };
  visit(tree);
};

// A platform-agnostic game card for Steam, PlayStation, Xbox, or Nintendo.
export const remarkGameCards: Plugin = () => (tree: any) => {
  const visit = (node: any) => {
    if (!Array.isArray(node.children)) return;
    const next: any[] = [];
    for (const child of node.children) {
      if (child.type === 'text') {
        const pattern = /\[gframe\]([^\]]*?)\[\/gframe\]/gi;
        let last = 0;
        for (const match of child.value.matchAll(pattern)) {
          const index = match.index ?? 0;
          if (index > last) next.push({ type: 'text', value: child.value.slice(last, index) });
          const fields = String(match[1] || '').split('|');
          const [store = '', storeId = '', title = '', platform = '', region = '', storeUrl = '', cover = '', description = '', releaseDate = '', developer = '', publisher = '', genres = ''] = fields;
          const params = new URLSearchParams({ store, storeId, title, platform, region, storeUrl, cover, description, releaseDate, developer, publisher, genres });
          next.push({ type: 'link', url: `https://game-card.invalid/platform?${params.toString()}`, title: null, children: [{ type: 'text', value: '' }] });
          last = index + match[0].length;
        }
        if (last) { if (last < child.value.length) next.push({ type: 'text', value: child.value.slice(last) }); }
        else next.push(child);
      } else { visit(child); next.push(child); }
    }
    node.children = next;
  };
  visit(tree);
};
