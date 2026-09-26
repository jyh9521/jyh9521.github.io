# 博客维护

网站由 Next.js 静态导出，通过 GitHub Actions 部署到 GitHub Pages。

## 编辑文章

打开 https://blog.blfy.cc/sveltia/ ，使用 GitHub 访问令牌登录 Sveltia CMS。文章保存在 `content/posts/*.md`，图片和附件保存在 `public/uploads/`。保存后会提交到 `main`，Pages 工作流自动重新构建网站。文章网址为 `/posts/<文件名>/`。

编辑器配置位于 `public/sveltia/config.yml`。访问令牌请只输入后台登录页面，勿写入仓库或文章。

## 本地预览

需要 Node.js 22。运行 `npm ci` 和 `npm run dev`；发布前可运行 `npm run check` 与 `npm run build`。静态网站输出在 `out/`。

## 原 TinaCloud 连接清理

网站构建和编辑已不使用 TinaCloud。确认 Sveltia 正常编辑和 Pages 部署后，可在 GitHub 仓库 Settings → Secrets and variables → Actions 删除旧的 `TINA_TOKEN` secret 和 `TINA_CLIENT_ID` variable，并在 GitHub Settings → Applications 中撤销 TinaCloud App 对本仓库的访问；TinaCloud 控制台中的旧项目也可以删除。
