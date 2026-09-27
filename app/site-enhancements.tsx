'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('blog-theme');
    const value = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(value); document.documentElement.dataset.theme = value ? 'dark' : 'light';
  }, []);
  function toggle() { const value = !dark; setDark(value); document.documentElement.dataset.theme = value ? 'dark' : 'light'; localStorage.setItem('blog-theme', value ? 'dark' : 'light'); }
  return <button className="theme-toggle" type="button" aria-label={dark ? '切换到浅色模式' : '切换到深色模式'} onClick={toggle}>{dark ? '☀' : '☾'}</button>;
}

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => { const max = document.documentElement.scrollHeight - innerHeight; setProgress(max > 0 ? Math.min(100, Math.max(0, scrollY / max * 100)) : 0); };
    update(); addEventListener('scroll', update, { passive: true }); addEventListener('resize', update);
    return () => { removeEventListener('scroll', update); removeEventListener('resize', update); };
  }, []);
  return <div className="reading-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>;
}

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = location.href;
    if (navigator.share) { try { await navigator.share({ title, url }); } catch { /* dismissed */ } return; }
    await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800);
  }
  return <button className="share-button" onClick={share}>{copied ? '链接已复制 ✓' : '分享文章 ↗'}</button>;
}

export function DailyPick({ items }: { items: { href: string; title: string }[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => { if (items.length) setIndex(Math.floor(Date.now() / 86400000) % items.length); }, [items.length]);
  const pick = items[index];
  return pick ? <a className="daily-pick" href={pick.href}><span>DAILY PICK · 今日回顾</span><strong>{pick.title}</strong><small>打开一篇旧文章，重新发现好内容 ↗</small></a> : null;
}

export function RandomPostButton({ items }: { items: string[] }) {
  function openRandom() { if (items.length) location.href = items[Math.floor(Math.random() * items.length)]; }
  return <button className="random-post-button" type="button" onClick={openRandom}>🎲 随机逛逛</button>;
}

export function FooterEasterEgg() {
  const [label, setLabel] = useState('保持好奇');
  const lines = ['愿你总能找到存档点。', '今天也要继续冒险。', '保持好奇，继续探索。', '下一个转角，也许有惊喜。'];
  return <button className="footer-easter-egg" onClick={() => setLabel(lines[Math.floor(Math.random() * lines.length)])} title="点我试试">{label} ✦</button>;
}
