# gameknife.github.io

易恺铭 / gameKnife 的个人站点。Astro 5 + TypeScript，GitHub Actions 部署到 GitHub Pages。

## 本地开发

需要 Node 22+（仓库里有 `.nvmrc`，用 fnm / nvm 的话先 `fnm use` 或 `nvm use`）。

```bash
npm install
npm run dev          # http://localhost:4321
```

```bash
npm run build        # astro build + pagefind 索引 -> dist/
npm run preview      # 预览构建产物（搜索只有在这里才可用）
npm run check        # 类型检查
npm run verify:urls  # 校验 44 个历史 URL 是否还在
npm run fonts:subset # 单独重跑中文子集
npm run fonts:fetch  # 重新抓取西文字体（升级版本时才需要）
```

## 目录

```
src/
  content/blog/     文章（Markdown，44 篇）
  content/works/    作品集条目
  data/
    site.ts         站点唯一配置源：域名 / 导航 / 社交 / 定位语 / Giscus / 统计
    cv.ts           A4 简历数据 —— 同时驱动 /cv/ 页面与 CI 导出的 PDF
    resume.ts       网页版长简历数据
    engine.ts       gkNextEngine 指标 / 特性 / 子项目
  components/       home · blog · ui
  layouts/          Base · Page · Post
  pages/            路由
  styles/global.css 设计 token
scripts/
  migrate-posts.mjs 一次性迁移（已跑完，留作记录）
  convert-data.mjs  一次性数据转换（已跑完）
  verify-urls.mjs   历史 URL 回归防线，CI 每次构建都跑
  print-cv.mjs      /cv/ -> dist/KaimingYi-CV.pdf
  legacy-urls.json  44 个历史路径的快照
legacy/             Jekyll 时期的原始文件，不参与构建，确认后可删
```

## 写一篇新文章

在 `src/content/blog/` 新建 `YYYY-MM-DD-slug.md`：

```yaml
---
title: 标题
date: 2026-01-01
category: tech          # tech | life | art
description: 一句话摘要。必填，会用在列表、搜索结果、OG 分享图和 RSS 上。
tags: [vulkan, 渲染]
featured: false         # true 则进首页精选位
zhihu: https://...      # 可选，同步到知乎后填上，文章页会显示互链
---
```

新文章的 URL 是 `/blog/{slug}/`。存量文章带 `legacyUrl` 字段，按原路径出页 —— **不要改这个字段**，它是十年外链的落点。

## /resume/ 与 /cv/

**`/resume/` 是站点的一页**（`Base.astro`，共用顶部导航与页脚），但保留旧站的排版气质：
Lora 衬线、荧光笔链接、`<dl>` 30/70 双栏。样式全部收在 `.resume-page` 之下 ——
原 `main.scss` 的 meyerweb 全局 reset 会把站点 header / footer 一起清掉，
`a { background: 荧光黄 }` 也会漏进导航栏，所以**不要把 `src/styles/resume.css` 里的规则提到全局**。

**`/cv/` 仍然独立**（`Standalone.astro`，不套站点 chrome、不引 `global.css`）。
它是打印产物：纸张在暗色模式下依然是白的，只有 chrome 变暗 —— 要和导出的 PDF 长得一模一样。
`/cv/` 走系统 Helvetica 栈，一个 Web Font 都不加载。

数据仍在 `src/data/cv.ts` / `resume.ts`，`<lis>` 这类标签由页面在渲染时生成，不再混进数据。

## 字体是自托管的

不依赖 Google Fonts —— 国内拉不下来就会退回系统字体，中文标题变回 SimSun。

- **中文标题** Noto Serif SC。`scripts/subset-fonts.mjs` 在每次 `npm run build` / `npm run dev` 前跑一次，
  扫描 `src/` 里出现过的全部中文字符做真子集：24 MB → 约 290 kB。
  **新文章带进来的新字会自动收进去**，不会出现豆腐块。
- **西文与等宽** Fraunces / JetBrains Mono，`/resume/` 另用 Lora / Playfair Display。
  这些由 `scripts/fetch-fonts.mjs` 一次性抓到 `public/fonts/`，升级字体版本时重跑。
- `/cv/` 走系统 Helvetica 栈，一个 Web Font 都不加载。

每页字体开销约 442 kB，且全站是同样三个文件 —— 翻到第二页就全部命中缓存。

**等宽字体有两个变量，别混用：**

- `--font-mono` —— UI 标签（导航、展签、日期、跳转链接）。末尾接的是中文黑体，
  **不是** 通用的 `monospace`：JetBrains Mono 没有中文字形，若留通用族，
  Windows 会把中文解析成新宋体（NSimSun），又细又旧。
- `--font-code` —— 真代码（代码块、内联 `code`）。保留通用 `monospace`，
  中文在这里该是等宽的，对齐比好看重要。

## 两条硬规矩

1. **历史 URL 不能动。** `scripts/verify-urls.mjs` 在 CI 里逐条核对 `scripts/legacy-urls.json`，少一个就构建失败。
2. **中文不加载 Web Font。** 全量 CJK 字体一个字重就是几 MB，会直接毁掉首屏。中文走系统栈，见 `--font-cjk`。

## 部署

推到 `master` 自动构建部署。**首次启用需要手动把仓库 Settings → Pages → Source 从 "Deploy from a branch" 改成 "GitHub Actions"**，改完之前 workflow 跑绿也不会上线。

## 待接入

`src/data/site.ts` 里三个字段留空，填上即生效：

- `giscus.*` —— GitHub Discussions 评论（在 <https://giscus.app> 生成）
- `analyticsToken` —— Cloudflare Web Analytics
- `social` 里的知乎 / B 站链接目前是推测的，需要核对

## License

代码 MIT（见 LICENSE.md）；文章与作品图片版权归作者所有。
