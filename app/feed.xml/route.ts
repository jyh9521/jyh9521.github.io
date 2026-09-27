import { getAllPosts } from '../../lib/posts';

export const dynamic = 'force-static';
const origin = 'https://blog.blfy.cc';
const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export async function GET() {
  const items = getAllPosts().map(post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${origin}/posts/${post.slug}/</link>
      <guid isPermaLink="true">${origin}/posts/${post.slug}/</guid>
      <pubDate>${new Date(post.updatedAt || post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.description || post.body.slice(0, 500))}</description>
      ${post.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>伯翎飞云的博客</title><link>${origin}/</link><description>关于游戏、技术和生活的个人记录。</description><language>zh-CN</language>
  ${items}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
