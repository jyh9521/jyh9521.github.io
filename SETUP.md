# 博客维护

网站由 Next.js 静态导出，通过 GitHub Actions 部署到 GitHub Pages。

## 编辑文章

打开 https://blog.blfy.cc/sveltia/ ，使用 GitHub 访问令牌登录 Sveltia CMS。文章保存在 `content/posts/*.md`，图片和附件保存在 `public/uploads/`。保存后会提交到 `main`，Pages 工作流自动重新构建网站。文章网址为 `/posts/<文件名>/`。

编辑器配置位于 `public/sveltia/config.yml`。访问令牌请只输入后台登录页面，勿写入仓库或文章。

## 游戏资料数据库

游戏搜索通过 Cloudflare Worker 的 `GameMetadataProvider` 层调用 RAWG 与 ScreenScraper，不要求 Twitch / IGDB 凭据。后台数据源可选自动、RAWG 或 ScreenScraper。每条记录保存在 `content/games/<slug>.md`：`gameMetadata` 只保存外部资料，顶层 `manual` 单独保存官方售卖渠道、获取状态和人工备注。文章游戏卡片用本地档案 slug 引用，因此页面构建和阅读不需要访问第三方 API。

复制根目录 `.env.example` 中的变量到 `workers/ns-counter/.dev.vars` 用于本地 Worker 调试；生产环境在 Cloudflare Worker 的 Secrets 中设置同名变量。`.dev.vars` 和 `.env` 已被 Git 忽略，不要提交密钥。

必需/可选变量：

- `RAWG_API_KEY`：RAWG API key。申请入口：[RAWG API Docs](https://rawg.io/apidocs)。
- `SCREENSCRAPER_DEV_ID` / `SCREENSCRAPER_DEV_PASSWORD`：ScreenScraper API 开发者凭据。
- `SCREENSCRAPER_SOFTNAME`：ScreenScraper 登记/确认的客户端名称；若申请信息未另行指定，可填 `blfy-blog`。
- `SCREENSCRAPER_USER_ID` / `SCREENSCRAPER_USER_PASSWORD`：可选的 ScreenScraper 用户账号凭据。

RAWG 与 ScreenScraper 凭据均可单独缺省；未配置或上游不可用时，Worker 会尝试另一个数据源，再返回可用缓存或空候选，已保存的游戏档案及静态页面继续正常工作。ScreenScraper 开发者凭据和 softname 按其官方 WebAPI 申请流程获取。

RAWG 的 API 文档提供个人/爱好项目申请入口；其免费方案限制为非商业项目，并要求在使用数据的页面链接回 RAWG。本站游戏卡片会显示来源链接。ScreenScraper 需先注册账号，再通过官方论坛联系团队介绍应用并申请开发者 ID、密码和登记的 `softname`；官方说明 API 面向免费分发的软件，其他用途需事先取得许可。

本地开发可复制 `workers/ns-counter/.dev.vars.example` 为 `.dev.vars`。Cloudflare 部署可在 Worker 目录运行以下命令分别录入密钥（按提示粘贴值）：

```powershell
npx wrangler secret put RAWG_API_KEY
npx wrangler secret put SCREENSCRAPER_DEV_ID
npx wrangler secret put SCREENSCRAPER_DEV_PASSWORD
npx wrangler secret put SCREENSCRAPER_USER_ID
npx wrangler secret put SCREENSCRAPER_USER_PASSWORD
```

`SCREENSCRAPER_SOFTNAME` 是非敏感配置，可在 Cloudflare Worker Variables 中设置，或用 `npx wrangler secret put SCREENSCRAPER_SOFTNAME` 存为 Secret。未使用的 Provider 无需创建对应变量。

游戏元数据缓存存放在 Worker 已绑定的 D1 数据库 `game_metadata_cache` 表：搜索结果保留 1 小时，详情保留 7 天；手动刷新可绕过详情缓存。资料被保存后由仓库中的 Markdown 游戏档案成为页面读取的本地数据源。按需更新 D1 schema 后发布 Worker：

```powershell
cd workers/ns-counter
npx wrangler d1 migrations apply ns-counter --remote
npx wrangler deploy
```

后台操作：进入「游戏档案」，在「游戏资料」中选择自动、RAWG 或 ScreenScraper 并搜索；结果展示封面、标题、年份、平台、开发商和明确的数据来源。手动选中正确条目后导入资料，编辑过的字段会保留。之后可点「刷新游戏资料」更新元数据；「正版渠道与人工状态」中的商店、状态和备注独立保存，不会被刷新覆盖。没有外部来源时仍可以手工填写资料和保存。

文章编辑器的平台入口显示为「PlayStation 游戏」「Nintendo 游戏」「Xbox 游戏」「PC 游戏」，对应的卡片只引用本地游戏档案，不表示元数据来源。RAWG / ScreenScraper / 未来 IGDB 是资料来源；Steam、GOG、Nintendo eShop、PlayStation Store 等是手动维护的正版渠道，两者保存在不同字段。游戏资料搜索导入后，可在 `selectedPlatforms` 中只勾选自己要记录的版本；RAWG 返回的完整平台列表仍保存在资料元数据中，但不会自动展开成一堆前台卡片。存在手动 `platforms` 卡片时，手动记录优先，不再从元数据重复生成卡片。

## 本地预览

需要 Node.js 22。运行 `npm ci` 和 `npm run dev`；发布前可运行 `npm run check` 与 `npm run build`。静态网站输出在 `out/`。

## 原 TinaCloud 连接清理

网站构建和编辑已不使用 TinaCloud。确认 Sveltia 正常编辑和 Pages 部署后，可在 GitHub 仓库 Settings → Secrets and variables → Actions 删除旧的 `TINA_TOKEN` secret 和 `TINA_CLIENT_ID` variable，并在 GitHub Settings → Applications 中撤销 TinaCloud App 对本仓库的访问；TinaCloud 控制台中的旧项目也可以删除。
