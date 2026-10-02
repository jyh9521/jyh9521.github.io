import type { Plugin } from 'unified';

// Frame cards reference a saved local game dossier by slug; provider IDs remain inside its metadata record.
export const remarkGameFrames: Plugin = () => (tree: any) => {
  const visit = (node: any) => {
    if (!Array.isArray(node.children)) return;
    const next: any[] = [];
    for (const child of node.children) {
      if (child.type === 'text') {
        const pattern = /\[(g|p|n|x|s)frame\]\s*([a-z0-9]+(?:-[a-z0-9]+)*)(?:\|([^|\]]*))?(?:\|([^|\]]*))?\s*\[\/\1frame\]/gi;
        let last = 0;
        for (const match of child.value.matchAll(pattern)) {
          const index = match.index ?? 0;
          if (index > last) next.push({ type: 'text', value: child.value.slice(last, index) });
          const frame = match[1].toLowerCase();
          const query = new URLSearchParams({ slug: match[2], title: match[3] || '', status: match[4] || '' });
          next.push({ type: 'link', url: `https://game-frame.invalid/${frame}?${query}`, title: null, children: [{ type: 'text', value: '' }] });
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
