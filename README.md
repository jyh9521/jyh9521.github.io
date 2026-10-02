# blog.blfy.cc

## 评论、访问统计与 GitHub 贡献日历

文章和关于我页面使用 Giscus 评论，绑定 `jyh9521/myblog` 仓库的 Announcements 分类。页脚访问量由同源 Cloudflare Worker 统计；GitHub 贡献日历位于关于我页面。

## 游戏资料

游戏资料后台通过 Cloudflare Worker 的统一 Provider 接口查询 RAWG → ScreenScraper，规范化后保存到 `content/games/`，文章卡片引用本地档案。无需配置 IGDB/Twitch。环境变量、凭据申请、缓存及 Worker 部署说明见 [SETUP.md](SETUP.md)。
