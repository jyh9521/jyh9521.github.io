import { getAllPosts } from '../lib/posts';
import { getGames } from '../lib/games';
import { extractImages } from './posts/markdown-utils';

export default function Achievements() {
  const posts = getAllPosts();
  const gameCount = getGames().length;
  const imageCount = posts.reduce((total, post) => total + extractImages(post.body).length, 0);
  const oldest = posts.map(post => Date.parse(post.date)).filter(Number.isFinite).sort((a, b) => a - b)[0];
  const blogAgeDays = oldest ? Math.max(0, Math.floor((Date.now() - oldest) / 86400000)) : 0;
  const badges = [
    { icon: '🌱', name: '第一篇记录', detail: '发布第一篇文章', count: posts.length, goal: 1 },
    { icon: '📚', name: '十篇收藏', detail: '累计发布十篇文章', count: posts.length, goal: 10 },
    { icon: '🖼️', name: '截图收藏家', detail: '文章收录二十张图片', count: imageCount, goal: 20 },
    { icon: '🎮', name: '游戏档案员', detail: '建立三个游戏档案', count: gameCount, goal: 3 },
    { icon: '🎂', name: '周年纪念', detail: '从第一篇文章起持续记录满一年', count: blogAgeDays, goal: 365 },
  ];
  return <section className="container achievements"><div className="section-title"><div><span className="section-kicker">MILESTONES</span><h2>博客成就</h2></div></div><div className="achievement-grid">{badges.map(badge => {
    const unlocked = badge.count >= badge.goal;
    return <article key={badge.name} className={`achievement-badge${unlocked ? ' is-unlocked' : ' is-locked'}`}><span className="achievement-icon">{badge.icon}</span><strong>{badge.name}</strong><small>{badge.detail}</small><span className="achievement-progress">{unlocked ? '已解锁' : `${badge.count} / ${badge.goal}${badge.name === '周年纪念' ? ' 天' : ''}`}</span></article>;
  })}</div></section>;
}
