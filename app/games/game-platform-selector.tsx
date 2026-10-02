'use client';

import { useMemo, useState } from 'react';
import { gameStoreLabels, type GameManual, type GamePlatform, type GameStore } from '../../lib/game-types';
import GamePlatformCard from './game-platform-card';

const order: GameStore[] = ['pc', 'playstation', 'xbox', 'nintendo'];
const familyOf = (platform: GamePlatform): GameStore => platform.store;
const safeUrl = (value: string) => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };

export default function GamePlatformSelector({ title, status, platforms, manual }: { title: string; status: string; platforms: GamePlatform[]; manual?: GameManual }) {
  const stores = useMemo(() => order.filter(store => platforms.some(platform => familyOf(platform) === store)), [platforms]);
  const [selected, setSelected] = useState<GameStore>(stores[0] || 'pc');
  const choices = platforms.filter(platform => familyOf(platform) === selected);
  if (!platforms.length) return <section className="game-platform-panel"><h2>游戏平台</h2><p>尚未添加游戏平台。可在管理后台的游戏档案中补充元数据。</p>
    {manual && <>
      <p className="game-availability">正版获取状态：{{ available: '可数字购买', delisted: '已下架', 'physical-only': '仅有实体版', free: '官方免费', unknown: '状态未知' }[manual.availabilityStatus]}</p>
      {manual.notes && <p>{manual.notes}</p>}
      {manual.officialStores.some(store => safeUrl(store.url)) && <div className="game-official-stores"><strong>正版购买</strong><div>{manual.officialStores.map((store, index) => { const href = safeUrl(store.url); return href && store.name ? <a key={`${store.name}-${index}`} href={href} target="_blank" rel="noopener noreferrer" title={[store.region, store.note].filter(Boolean).join(' · ') || store.name}>{store.name}</a> : null; })}</div></div>}
    </>}
  </section>;

  return <section className="game-platform-panel" aria-label="选择游戏平台">
    <div className="game-platform-tabs" role="tablist" aria-label="游戏平台家族">
      {stores.map(store => <button key={store} type="button" role="tab" aria-selected={selected === store} className={selected === store ? `is-selected is-selected-${store}` : ''} onClick={() => setSelected(store)}>{gameStoreLabels[store]}</button>)}
    </div>
    <div className="game-platform-list">{choices.map((platform, index) => <GamePlatformCard key={`${platform.store}-${platform.platform}-${platform.catalogId || index}`} gameTitle={title} status={status} platform={platform} manual={manual} />)}</div>
  </section>;
}
