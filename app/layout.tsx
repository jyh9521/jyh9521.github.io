import type { Metadata } from 'next';
import './style.css';

export const metadata: Metadata = {
  title: { default: "BLFY's Blog", template: "%s | BLFY's Blog" },
  description: '个人博客', metadataBase: new URL('https://blog.blfy.cc')
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>
    <header className="site-header"><div className="header-inner">
      <a className="brand" href="/" aria-label="BLFY 博客首页"><span className="brand-icon" aria-hidden="true">B</span><span>BLFY<span className="brand-dot">.</span></span></a>
      <nav aria-label="主导航"><a href="/">首页</a><a href="/posts/">文章</a></nav>
    </div></header>
    {children}
    <footer className="site-footer"><div className="footer-inner"><div><a className="footer-brand" href="/">BLFY<span>.</span></a><p>关于游戏、技术和生活的个人记录。</p></div><div className="footer-links"><a href="/">首页</a><a href="/posts/">文章</a><a href="/sveltia/">管理</a></div></div><div className="footer-bottom">© BLFY · 保持好奇</div></footer>
  </body></html>;
}
