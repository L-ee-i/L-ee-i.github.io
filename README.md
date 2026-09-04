# Lee's SecLab

这是 [leei.site](https://leei.site/) 的 Hexo 源码仓库。站点使用 Hexo 7、Redefine 2.9 和 GitHub Actions 构建，并由 GitHub Pages 发布；自定义域名经 Cloudflare 代理访问。

## 本地运行

需要 Node.js 22 和 npm。

```powershell
npm ci
npm run server
```

浏览器打开 `http://localhost:4000/`。修改依赖后应提交同步更新的 `package-lock.json`。

## 发布流程

推送到 `main` 后，`.github/workflows/deploy.yml` 会执行以下步骤：

1. 在干净的 Node.js 22 环境安装锁定依赖；
2. 生成静态站点；
3. 检查必要页面、站内链接和占位配置；
4. 将 `public/` 发布到 GitHub Pages。

不再使用本地 `hexo deploy`，也不要把 `public/` 或 `node_modules/` 提交到仓库。

## 常用命令

```powershell
npm run rebuild       # 清理后重新生成
npm run verify:output # 校验生成结果
npm run list:posts    # 查看文章清单
```

## 目录说明

- `source/_posts/`：文章 Markdown 源文件
- `source/images/`、`source/assets/`：站点与文章图片
- `source/css/`、`source/js/`：自定义样式和脚本
- `_config.yml`：Hexo 主配置
- `_config.redefine.yml`：主题配置
- `scripts/`：构建阶段自动执行的资源清理逻辑
- `tools/`：手动或 CI 调用的输出校验工具

## 回滚

迁移前发布版本永久保存在远端分支 `legacy-published-2026-09-04`。如新流程发生严重故障，可从该分支恢复旧的静态站点；本地完整快照和三份 Git 历史 bundle 另行保存。
