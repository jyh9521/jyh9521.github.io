export type GameStore = 'steam' | 'playstation' | 'xbox' | 'nintendo';
export type GamePlatform = {
  store: GameStore;
  platform: string;
  region: string;
  storeId: string;
  storeUrl: string;
  cover: string;
  description: string;
  developer: string;
  publisher: string;
  releaseDate: string;
  genres: string[];
  catalogSource: string;
  catalogId: string;
};
export type GameEvent = { date: string; title: string; note: string };
export type GameRecord = { slug: string; title: string; status: string; summary: string; platforms: GamePlatform[]; events: GameEvent[] };

export const gameStoreLabels: Record<GameStore, string> = {
  steam: 'Steam', playstation: '索尼 PlayStation', xbox: '微软 Xbox', nintendo: '任天堂',
};
