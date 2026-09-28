'use client';

import { useMemo, useState } from 'react';
import { gameStoreLabels, type GamePlatform, type GameStore } from '../../lib/game-types';
import GamePlatformCard from './game-platform-card';

const order: GameStore[] = ['pc', 'playstation', 'xbox', 'nintendo'];
const familyOf = (platform: GamePlatform): GameStore => platform.store;

export default function GamePlatformSelector({ title, status, platforms }: { title: string; status: string; platforms: GamePlatform[] }) {
  const stores = useMemo(() => order.filter(store => platforms.some(platform => familyOf(platform) === store)), [platforms]);
  const [selected, setSelected] = useState<GameStore>(stores[0] || 'pc');
  const choices = platforms.filter(platform => familyOf(platform) === selected);
  if (!platforms.length) return <section className="game-platform-panel"><h2>游戏平台</h2><p>尚未添加游戏平台。可在管理后台的游戏档案中选择 IGDB 游戏资料。</p></section>;

  return <section className="game-platform-panel" aria-label="选择游戏平台">
    <div className="game-platform-tabs" role="tablist" aria-label="游戏平台家族">
      {stores.map(store => <button key={store} type="button" role="tab" aria-selected={selected === store} className={selected === store ? 'is-selected' : ''} onClick={() => setSelected(store)}>{gameStoreLabels[store]}</button>)}
    </div>
    <div className="game-platform-list">{choices.map((platform, index) => <GamePlatformCard key={`${platform.store}-${platform.platform}-${platform.catalogId || index}`} gameTitle={title} status={status} platform={platform} />)}</div>
  </section>;
}
