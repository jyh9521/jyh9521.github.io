'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { GameRecord } from '../../lib/game-types';
import { gameStoreLabels } from '../../lib/game-types';
import { gameStatuses } from '../../lib/game-status';

export default function GameShelf({ games }: { games: GameRecord[] }) {
  const [query, setQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const platformOptions = useMemo(() => [...new Set(games.flatMap(game => game.platforms.map(platform => `${gameStoreLabels[platform.store]} · ${platform.platform}`)))].sort((a, b) => a.localeCompare(b, 'zh-CN')), [games]);
  const statusOptions = [...gameStatuses];
  const yearOf = (game: GameRecord) => (game.metadata?.releaseDate || game.platforms.find(platform => platform.releaseDate)?.releaseDate || '').slice(0, 4);
  const yearOptions = useMemo(() => [...new Set(games.map(yearOf).filter(year => /^\d{4}$/.test(year)))].sort((a, b) => b.localeCompare(a)), [games]);
  const genresOf = (game: GameRecord) => [...new Set([...(game.metadata?.genres || []), ...game.platforms.flatMap(platform => platform.genres || [])])];
  const genreOptions = useMemo(() => [...new Set(games.flatMap(genresOf))].sort((a, b) => a.localeCompare(b, 'zh-CN')), [games]);
  const filteredGames = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return games.filter(game => {
      const searchText = [game.title, game.metadata?.localizedName, game.metadata?.originalName, ...(game.metadata?.alternativeNames || [])].filter(Boolean).join(' ').toLocaleLowerCase();
      const platforms = game.platforms.map(platform => `${gameStoreLabels[platform.store]} · ${platform.platform}`);
      return (!normalizedQuery || searchText.includes(normalizedQuery))
        && (platformFilter === 'all' || platforms.includes(platformFilter))
        && (statusFilter === 'all' || game.status === statusFilter)
        && (yearFilter === 'all' || yearOf(game) === yearFilter)
        && (genreFilter === 'all' || genresOf(game).includes(genreFilter));
    });
  }, [games, query, platformFilter, statusFilter, yearFilter, genreFilter]);

  if (!games.length) return <p className="empty-posts">还没有游戏档案，之后可在 Sveltia 后台添加。</p>;
  const select = (label: string, value: string, options: string[], onChange: (value: string) => void) => <label className="game-filter-field"><span>{label}</span><select value={value} onChange={event => onChange(event.target.value)}><option value="all">全部</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select></label>;
  return <>
    <div className="game-filters" aria-label="筛选游戏档案">
      <label className="game-filter-field game-filter-search"><span>搜索游戏</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="按游戏名称或别名搜索" /></label>
      {select('平台', platformFilter, platformOptions, setPlatformFilter)}
      {select('游玩状态', statusFilter, statusOptions, setStatusFilter)}
      {select('发售年份', yearFilter, yearOptions, setYearFilter)}
      {select('类型', genreFilter, genreOptions, setGenreFilter)}
      <p className="game-filter-count" aria-live="polite">显示 {filteredGames.length} / {games.length} 款</p>
    </div>
    {filteredGames.length ? <div className="game-shelf">{filteredGames.map(game => {
    const cover = game.platforms.find(platform => platform.cover)?.cover || game.metadata?.cover || '';
    const platformNames = [...new Set(game.platforms.map(platform => `${gameStoreLabels[platform.store]} · ${platform.platform}`))];
    const family = game.platforms[0]?.store || 'pc';
    return <article className="game-shelf-item" key={game.slug}>
      <div className="game-shelf-copy">
        <div className="game-shelf-title"><Link href={`/games/${game.slug}/`}>{game.title} ↗</Link><span>{game.status}</span></div>
        {game.summary && <p>{game.summary}</p>}
        {platformNames.length > 0 && <div className="game-shelf-platforms">{platformNames.map(label => <span key={label}>{label}</span>)}</div>}
        <Link className={`game-platform-link game-platform-link-${family}`} href={`/games/${game.slug}/`}>查看游戏档案 ↗</Link>
      </div>
      <Link className="game-shelf-art" href={`/games/${game.slug}/`} aria-label={`查看${game.title}档案`}>
        {cover ? <img src={cover} alt={`${game.title} 封面`} loading="lazy" /> : <span aria-hidden="true">🎮</span>}
      </Link>
    </article>;
    })}</div> : <p className="empty-posts game-filter-empty">没有符合条件的游戏。试试清空搜索词或调整筛选条件。</p>}
  </>;
}
