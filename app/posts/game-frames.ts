import type { Plugin } from 'unified';

// [pframe]/[nframe]/[xframe]/[sframe] load game metadata from IGDB by Game ID.
export const remarkGameFrames: Plugin = () => (tree: any) => {
  const visit = (node: any) => {
    if (!Array.isArray(node.children)) return;
    const next: any[] = [];
    for (const child of node.children) {
      if (child.type === 'text') {
        const pattern = /\[(p|n|x|s)frame\]\s*(\d{1,12})(?:\|([^|\]]*))?(?:\|([^|\]]*))?\s*\[\/\1frame\]/gi;
        let last = 0;
        for (const match of child.value.matchAll(pattern)) {
          const index = match.index ?? 0;
          if (index > last) next.push({ type: 'text', value: child.value.slice(last, index) });
          const frame = match[1].toLowerCase();
          const query = new URLSearchParams({ id: match[2], title: match[3] || '', status: match[4] || '' });
          next.push({ type: 'link', url: `https://igdb-frame.invalid/${frame}?${query}`, title: null, children: [{ type: 'text', value: '' }] });
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
