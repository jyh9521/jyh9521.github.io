export type GameStore = 'pc' | 'playstation' | 'xbox' | 'nintendo' | 'steam';
export type GamePlatform = {
  store: GameStore;
  platform: string;
  region: string;
  storeId: string;
  storeUrl: string;
  catalogUrl: string;
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
  pc: 'PC', steam: 'Steam', playstation: 'PlayStation', xbox: 'Xbox', nintendo: 'Nintendo',
};

export const gamePlatforms: Record<Exclude<GameStore, 'steam'>, string[]> = {
  pc: ['Steam', 'Epic Games Store', 'GOG', 'Ubisoft Connect', 'EA app', 'Battle.net', 'itch.io', 'Microsoft Store', '其他 PC 商店'],
  playstation: ['PS5 Pro', 'PS5', 'PS4 Pro', 'PS4', 'PS3', 'PS Vita', 'PSP', 'PS2', 'PS1'],
  xbox: ['Xbox Series X|S', 'Xbox One X', 'Xbox One', 'Xbox 360', '初代 Xbox'],
  nintendo: ['Switch 2', 'Switch', '3DS', 'DS', 'Wii U', 'Wii', 'GameCube', 'Game Boy Advance', 'Game Boy'],
};
