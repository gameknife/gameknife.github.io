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
  content/blog/     文章（Markdown，44 篇已发布 + 12 篇 draft）
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
  migrate-content-ops.mjs 知乎稿 -> 博客草稿，一次性（已跑完）
  verify-urls.mjs   历史 URL 回归防线，CI 每次构建都跑
  print-cv.mjs      /cv/ -> dist/KaimingYi-CV.pdf
  legacy-urls.json  44 个历史路径的快照
legacy/             Jekyll 时期的原始文件，不参与构建，确认后可删
content-ops/        写作台：策略、发布计划、证据、分发流程。不进 git
```

## 写一篇新文章

选题、事实口径和发布计划在 `content-ops/`（不进 git，见该目录的 `README.md`）。
**文章本体一律在 `src/content/blog/`** —— 草稿和已发布同处一地，靠 `draft` 区分。

在 `src/content/blog/` 新建 `YYYY-MM-DD-slug.md`：

```yaml
---
title: 标题
date: 2026-01-01
category: tech          # tech | life | art
description: 一句话摘要。必填，会用在列表、搜索结果、OG 分享图和 RSS 上。
tags: [vulkan, 渲染]
draft: true             # 写作中。dev 里可见，生产构建里被过滤掉
featured: false         # true 则进首页精选位
zhihu: https://...      # 可选，同步到知乎后填上，文章页会显示互链
---
```

新文章的 URL 是 `/blog/{slug}/`。存量文章带 `legacyUrl` 字段，按原路径出页 —— **不要改这个字段**，它是十年外链的落点。

发布就是删掉 `draft: true` 那一行。文件名、图片相对路径和 URL 都不变 ——
草稿在 `npm run dev` 里已经按最终 URL 渲染过一遍，所见即所发。

正文引用的图放 `src/assets/blog/`，用相对路径写：`![说明](../../assets/blog/foo.webp)`。
**引用一张不存在的图会让 `astro build` 直接失败**，配图还没产出就先写成 HTML 注释。

上线之后继续改是正常的 —— 博客是唯一主档，同步到知乎/公众号/小红书的是某个时间点的
副本，不回流。完整流程见 `content-ops/writing-strategy.md`。

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

## 配色只有一条规则

**中性色 R = G，只留 G−B。** 也就是不放红分量 —— 一旦 R > G，整套就会往赭石/陶土偏，
那是当下 AI 生成配色最常见的落点。去掉红以后暖意变成烟灰，底色读作石墨。

G−B 随明度递增（底 2 → 分割线 4 → 文字 7~9）：暗处近乎中性，只在亮处透出一点纸感，
而不是整体染色。亮色主题是同一条规则反过来 —— 中性纸，不是奶油色。

强调色全站只有一个（松烟灰绿），用得极省；温度对比来自「暖字 / 中性底 / 冷点缀」，
不是靠把底色染暖。**改配色时先守住 R = G，再谈别的。**

`--faint` 是最弱的一级，对比度压在 3.4:1 —— 只用于装饰性标注。
**内容文字最低用 `--muted`**（暗色 5.0:1 / 亮色 4.7:1，过 AA）。

## 两条硬规矩

1. **历史 URL 不能动。** `scripts/verify-urls.mjs` 在 CI 里逐条核对 `scripts/legacy-urls.json`，少一个就构建失败。
2. **中文不加载 Web Font。** 全量 CJK 字体一个字重就是几 MB，会直接毁掉首屏。正文中文走系统栈，见 `--font-body`。（中文标题是例外，走 Noto Serif SC 真子集。）

## 部署

推到 `master` 自动构建部署。**首次启用需要手动把仓库 Settings → Pages → Source 从 "Deploy from a branch" 改成 "GitHub Actions"**，改完之前 workflow 跑绿也不会上线。

## 待接入

`src/data/site.ts` 里三个字段留空，填上即生效：

- `giscus.*` —— GitHub Discussions 评论（在 <https://giscus.app> 生成）
- `analyticsToken` —— Cloudflare Web Analytics
- `social` 里的知乎 / B 站链接目前是推测的，需要核对

## License

代码 MIT（见 LICENSE.md）；文章与作品图片版权归作者所有。
