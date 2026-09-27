import GameShelf from './game-shelf';
import { getGames } from '../../lib/games';

export const metadata = { title: 'Steam 游戏档案' };
export default function GamesPage() { return <main className="article-shell"><div className="container game-directory"><span className="section-kicker">PLAY LOG</span><h1>Steam 游戏档案</h1><p>游戏资料、游玩状态与相关博客记录。</p><GameShelf games={getGames()} /></div></main>; }
