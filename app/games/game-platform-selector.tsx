'use client';

import { useMemo, useState } from 'react';
import { gameStoreLabels, type GamePlatform, type GameStore } from '../../lib/game-types';
import GamePlatformCard from './game-platform-card';

const order: GameStore[] = ['pc', 'playstation', 'xbox', 'nintendo'];
const familyOf = (platform: GamePlatform): GameStore => platform.store === 'steam' ? 'pc' : platform.store;

export default function GamePlatformSelector({ title, status, platforms, detailHref }: { title: string; status: string; platforms: GamePlatform[]; detailHref?: string }) {
  const stores = useMemo(() => order.filter(store => platforms.some(platform => familyOf(platform) === store)), [platforms]);
  const [selected, setSelected] = useState<GameStore>(stores[0] || 'steam');
  const choices = platforms.filter(platform => familyOf(platform) === selected);
  if (!platforms.length) return <section className="game-platform-panel"><h2>游戏平台</h2><p>尚未添加平台版本。可在管理后台的游戏档案中添加平台及商店资料。</p></section>;

  return <section className="game-platform-panel" aria-label="选择游戏平台">
    <div className="game-platform-tabs" role="tablist" aria-label="商店平台">
      {stores.map(store => <button key={store} type="button" role="tab" aria-selected={selected === store} className={selected === store ? 'is-selected' : ''} onClick={() => setSelected(store)}>{gameStoreLabels[store]}</button>)}
    </div>
    <div className="game-platform-list">{choices.map((platform, index) => <GamePlatformCard key={`${platform.store}-${platform.platform}-${platform.storeId}-${index}`} gameTitle={title} status={status} platform={platform} detailHref={detailHref} />)}</div>
  </section>;
}
