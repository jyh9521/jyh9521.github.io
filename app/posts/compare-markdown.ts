import type { Plugin } from 'unified';

export const remarkImageCompare: Plugin = () => (tree: any) => {
  const visit = (node: any) => {
    if (!Array.isArray(node.children)) return;
    const next: any[] = [];
    for (const child of node.children) {
      if (child.type !== 'text') { visit(child); next.push(child); continue; }
      const pattern = /\[compare\]\s*([^|\]]+)\|([^|\]]+)(?:\|([^|\]]*))?(?:\|([^|\]]*))?\s*\[\/compare\]/gi;
      let last = 0;
      for (const match of child.value.matchAll(pattern)) {
        const index = match.index ?? 0;
        if (index > last) next.push({ type: 'text', value: child.value.slice(last, index) });
        const params = new URLSearchParams({ before: match[1].trim(), after: match[2].trim(), beforeLabel: match[3] || '之前', afterLabel: match[4] || '之后' });
        next.push({ type: 'link', url: `https://image-compare.invalid/compare?${params}`, title: null, children: [{ type: 'text', value: '' }] });
        last = index + match[0].length;
      }
      if (last) { if (last < child.value.length) next.push({ type: 'text', value: child.value.slice(last) }); }
      else next.push(child);
    }
    node.children = next;
  };
  visit(tree);
};
