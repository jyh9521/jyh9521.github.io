import type { Metadata } from 'next';
import './style.css';

export const metadata: Metadata = {
  title: { default: "BLFY's Blog", template: "%s | BLFY's Blog" },
  description: '个人博客', metadataBase: new URL('https://blog.blfy.cc')
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body><header className="masthead"><a className="brand" href="/">BLFY<span>.</span></a><nav><a href="/">首页</a><a href="/posts/">文章</a></nav></header>{children}<footer>© BLFY · <a href="/admin/index.html">管理</a></footer></body></html>;
}
