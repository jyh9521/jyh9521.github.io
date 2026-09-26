import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const postsDir = path.join(process.cwd(), 'content/posts');

export type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  cover: string;
  tags: string[];
  body: string;
  audio: string;
  video: string;
  attachment: string;
};

export function getPost(slug: string): Post | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const file = path.join(postsDir, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  const date = data.date instanceof Date ? data.date.toISOString() : String(data.date || '');
  return {
    slug,
    title: String(data.title || slug),
    date,
    description: String(data.description || ''),
    cover: String(data.cover || ''),
    tags: Array.isArray(data.tags) ? data.tags.filter(Boolean).map(String) : [],
    body: content,
    audio: String(data.audio || ''),
    video: String(data.video || ''),
    attachment: String(data.attachment || ''),
  };
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDir)) return [];
  return fs.readdirSync(postsDir)
    .filter(name => /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(name))
    .flatMap(name => {
      const post = getPost(name.slice(0, -3));
      return post ? [post] : [];
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}
