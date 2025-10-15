# 9_hpg

[![Build and deploy to Cloudflare Pages](https://github.com/key366/9_hpg/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/key366/9_hpg/actions/workflows/deploy-pages.yml)

这是九号轰趴馆的静态站点源码和自动化部署配置。仓库包含：

- `tools/optimize_site.py` - 站点静态资源优化脚本（minify、图片转 WebP 等）
- `.github/workflows/deploy-pages.yml` - GitHub Actions 工作流，用于在每次 push 到 `main` 时构建并部署到 Cloudflare Pages
- `tools/DEPLOY_MANIFEST.md` - 部署清单

部署状态请查看上方 Actions badge；如果 badge 显示失败，请在 Actions 页面查看具体日志。
