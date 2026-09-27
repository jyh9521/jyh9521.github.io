import type { Metadata } from 'next';
import './style.css';

export const metadata: Metadata = {
  title: { default: "伯翎飞云的博客", template: "%s | 伯翎飞云的博客" },
  description: '个人博客', metadataBase: new URL('https://blog.blfy.cc')
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>
    <header className="site-header"><div className="header-inner">
      <a className="brand" href="/" aria-label="伯翎飞云的博客首页"><img className="brand-icon" src="/avatar.jpg" alt="" /><span>伯翎飞云<span className="brand-dot">.</span></span></a>
      <nav aria-label="主导航"><a href="/">首页</a><a href="/posts/">文章</a><a href="/about/">关于我</a></nav>
    </div></header>
    {children}
    <footer className="site-footer"><div className="footer-inner"><div><a className="footer-brand" href="/">伯翎飞云<span>.</span></a><p>关于游戏、技术和生活的个人记录。</p></div><div className="footer-links"><a href="/">首页</a><a href="/posts/">文章</a><a href="/about/">关于我</a><a href="/sveltia/">管理</a></div></div><div className="footer-bottom">© 伯翎飞云 · 保持好奇</div></footer>
  </body></html>;
}
