# BLFY 博客部署说明

此分支将原来只有一个 Jekyll 首页的仓库迁移为 Next.js 静态导出 + TinaCMS。原站点在合并前保持运行。

## TinaCloud

1. 在 https://app.tina.io/ 创建项目，连接 `jyh9521/jyh9521.github.io`，选择 `main` 分支。
2. 将站点 URL 设为 `https://blog.blfy.cc`，授权自己的编辑账号。
3. 仓库 Settings → Secrets and variables → Actions：添加变量 `TINA_CLIENT_ID`（项目 Client ID），添加 Secret `TINA_TOKEN`（只读内容 Token）。不要把 Token 提交到仓库。
4. 合并本 PR 后，在 Settings → Pages → Build and deployment 将 Source 设为 **GitHub Actions**。保留 Custom domain `blog.blfy.cc` 和 Cloudflare 的 DNS only CNAME。
5. 在 Actions 中运行 `Deploy blog to GitHub Pages`，确认页面及 `https://blog.blfy.cc/admin/index.html`。编辑后保存，TinaCloud 提交到 main，再触发发布工作流。

## 本地开发

使用 Node.js 22，运行 `npm install`、`npm run dev`，浏览 `http://localhost:3000/admin/index.html`。内容在 `content/posts/*.md`，图片等媒体默认在 `public/uploads`。需要生产构建时先在环境中提供 `NEXT_PUBLIC_TINA_CLIENT_ID` 和 `TINA_TOKEN`，再运行 `npm run build`。

## 媒体范围

当前编辑器有图片、音频、视频、文档字段；它们使用 Tina 默认媒体库。大文件和长期大量媒体应在下一阶段接入独立对象存储及受保护的上传处理器。不要把对象存储密钥放在前端或仓库中。

## 发布前检查

- Actions 构建与部署成功，`out/CNAME` 为 `blog.blfy.cc`。
- `/admin/index.html` 能登录；修改测试文章时预览同步更新。
- 保存后仓库出现内容提交，公开文章链接和媒体可以访问。
