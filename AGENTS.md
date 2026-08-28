# AGENTS.md

易恺铭 / gameKnife 的个人站点。Astro 5 + TypeScript，推 `master` 由 GitHub Actions 构建部署到 GitHub Pages。

这个文件是给 agent 看的操作手册：**会踩的坑、改完要跑什么、常见任务怎么做**。
站点本身的设计理由写在 [README.md](README.md)，不在这里重复。

## 立刻能跑

```bash
npm install && npm run dev
```

本地 `.nvmrc` 是 Node 22（CI 用 24）。dev 在 <http://localhost:4321>。

**开工前先看 4321 有没有人在跑** —— 作者常年挂着一个 `astro dev`。端口被占时不要直接 kill，
先 `ps -p <pid> -o command` 认一眼；是他自己的 dev server 就直接复用（同一个项目，HMR 会接住改动）。

| 命令 | 用途 |
|---|---|
| `npm run dev` | 开发服务器。**草稿只在这里可见** |
| `npm run build` | 子集化字体 → astro build → pagefind 索引 → `dist/` |
| `npm run check` | `astro check`，类型 + content schema 校验 |
| `npm run verify:urls` | 历史 URL 回归防线，**CI 每次构建都跑** |
| `npm run preview` | 预览构建产物（站内搜索只有这里能用） |

## 三条硬规矩

### 1. 历史 URL 一个字节都不能动

44 篇存量文章带 `legacyUrl` frontmatter，按原路径出页。`scripts/verify-urls.mjs` 逐条比对
`scripts/legacy-urls.json`，**少一个就 `process.exit(1)`，CI 直接挂**。

除了这 44 条，还硬性要求这些路由存在：

- 关键页：`/`、`/blog/`、`/engine/`、`/works/`、`/resume/`、`/cv/`、`/about/`、`/404.html`
- 旧栏目页（靠 `astro.config.mjs` 的 redirects 接住）：`/gallery/`、`/art/`、`/tech/`、`/life/`

**不要改任何文章的 `legacyUrl`，不要删这些路由。** 这是十年外链和搜索权重的落点。

### 2. 中文不加载 Web Font

全量 CJK 字体一个字重就是几 MB，会直接毁掉首屏。正文中文走系统栈，见 `--font-body`
（`system-ui` → `PingFang SC` / `Hiragino Sans GB` / `Microsoft YaHei`）。

**中文标题**是例外：Noto Serif SC，但走真子集 —— `scripts/subset-fonts.mjs` 在每次
`dev` / `build` 前扫描 `src/` 里出现过的全部中文字符，24 MB 裁到约 290 kB。
新文章带进来的新字会自动收进去，不会有豆腐块，**不需要手动跑**。

源字体不进仓库（`.fonts-cache/` 已 gitignore），缺失时脚本自动下载。

### 3. 配色守住 R = G

中性色只留 G−B，**不放红分量**。一旦 R > G 整套就往赭石/陶土偏 —— 那是当下 AI
生成配色最常见的落点。改配色先守住这条，再谈别的。见 `src/styles/global.css` 顶部注释。

## 写文章

文章本体一律在 `src/content/blog/`，**草稿和已发布同处一地**，靠 frontmatter 的 `draft` 区分。

```text
content-ops/ 选题卡与证据（不进 git）
  → src/content/blog/YYYY-MM-DD-slug.md，draft: true
  → npm run dev 里按最终 URL 边写边看
  → 删掉 draft: true 那一行 → 上线
```

`draft: true` 在 dev 里可见，生产构建被 `src/lib/posts.ts:14` 过滤掉，不进列表 / RSS / 搜索 / sitemap。
**发布就是删掉一行** —— 文件名、图片相对路径、URL 都不变。

### frontmatter

schema 在 `src/content.config.ts`，字段写错 `npm run check` 会报。

```yaml
---
title: 标题                 # 必填，≤ 80 字
date: 2026-01-01           # 必填
category: tech             # 必填，只能是 tech | life | art
description: 一句话摘要      # 必填，10–200 字。喂给列表 / <meta> / OG 图 / RSS，四处露脸
tags: [vulkan, 渲染]
draft: true                # 写作中
featured: false            # true 进首页精选位
unlisted: false            # 有 URL 但不进列表 / RSS / 搜索（残稿用）
zhihu: https://...         # 同步到知乎后填，文章页渲染成互链入口
legacyUrl: /tech/2025/.../ # 存量文章专用，绝对不要改也不要给新文章加
---
```

新文章 URL 是 `/blog/{文件名去掉扩展名}/`。

### 图片

放 `src/assets/blog/`，正文用相对路径引：

```markdown
![说明](../../assets/blog/foo.webp)
```

**引用一张不存在的图会让 `astro build` 直接失败。** 配图还没产出时写成 HTML 注释，
不要留空的 `![]()`：

```markdown
<!-- TODO 配图未产出：foo.webp（说明）。补图放进 src/assets/blog/ 后改回 ![说明](../../assets/blog/foo.webp) -->
```

远程图（GitHub raw 等）不走图片管线，可以直接用，但要固定到 commit，别用会漂移的分支路径。

## content-ops/ 与分发

`content-ops/` 是写作台：策略、项目事实口径、发布计划、证据快照、分发流程。

**它在 `.gitignore` 里** —— 仓库是公开的，未发布档期和 go / no-go 不提前公开。
所以**新克隆的仓库不会有这个目录，这是正常的，不要重建它**。存在时先读
`content-ops/README.md`，那是索引。

分发原则：**博客是主档，平台是副本，单向同步**。上线后继续改博客是正常的，
平台副本过时不是问题，主档错着才是。

⚠️ **知乎往返会丢掉行内 `code` 的反引号**（`<b>` 能活，`<code>` 被 sanitizer 吃掉）。
所以从知乎往回同步**不能整篇覆盖** —— 必须逐段比对文本、保留本地的行内格式。
做法参考 `content-ops/projects/gknextengine/release-plan.md` 里的已知差异表。

## 容易踩的设计 token

| token | 用途 | 坑 |
|---|---|---|
| `--font-mono` | UI 标签（导航、展签、日期、跳转链接） | 末尾接的是**中文黑体不是 `monospace`**。JetBrains Mono 没有中文字形，留通用族的话 Windows 会解析成新宋体，又细又旧 |
| `--font-code` | 真代码（代码块、内联 `code`） | 保留通用 `monospace`。中文在这里该是等宽的，对齐比好看重要 |
| `--faint` | 装饰性标注 | 对比度只有 3.4:1。**内容文字最低用 `--muted`**（暗 5.0:1 / 亮 4.7:1，过 AA） |

**这两个等宽变量别混用。**

## 两个页面是特例

- **`/resume/`** 是站点的一页（`Base.astro`，共用导航页脚），但保留旧站排版气质。
  样式全收在 `.resume-page` 之下 —— 原 `main.scss` 的 meyerweb 全局 reset 会把站点
  header / footer 一起清掉，`a { background: 荧光黄 }` 也会漏进导航栏。
  **不要把 `src/styles/resume.css` 的规则提到全局。**
- **`/cv/`** 独立（`Standalone.astro`，不套站点 chrome、不引 `global.css`）。
  它是打印产物，要和 CI 导出的 PDF 长得一模一样：纸张在暗色模式下依然是白的，
  走系统 Helvetica 栈，一个 Web Font 都不加载。

## 目录地图

```
src/
  content/blog/      文章（44 篇已发布 + 若干 draft）
  content/works/     作品集条目
  content.config.ts  两个 collection 的 schema
  data/site.ts       站点唯一配置源：域名 / 导航 / 社交 / 定位语 / Giscus / 统计
  data/cv.ts         A4 简历数据 —— 同时驱动 /cv/ 页面与 CI 导出的 PDF
  data/resume.ts     网页版长简历数据
  data/engine.ts     gkNextEngine 指标 / 特性 / 子项目
  lib/posts.ts       文章查询与 URL 规则，draft / unlisted 过滤都在这
  layouts/           Base · Page · Post · Standalone
  components/        home · blog · ui
  pages/og/          OG 图动态生成
  styles/global.css  设计 token
scripts/
  subset-fonts.mjs   中文子集化，dev / build 前自动跑
  verify-urls.mjs    历史 URL 回归防线
  print-cv.mjs       /cv/ -> dist/KaimingYi-CV.pdf
  legacy-urls.json   44 个历史路径的快照
  migrate-*.mjs      一次性迁移，已跑完，留作记录
legacy/              Jekyll 时期原始文件，不参与构建
content-ops/         写作台，不进 git（新克隆没有是正常的）
```

## 改完要跑什么

改了内容或组件：

```bash
npm run check && npm run build && npm run verify:urls
```

三条都要过。`verify:urls` 依赖 `dist/`，必须在 `build` 之后跑。

**改了会在浏览器里看到的东西，就自己去看** —— 起 dev server、开页面、确认，
别让作者手动验。改了纯配置、脚本或类型则不必。

## 当前状态与待办

- `src/content/blog/` 里有 39 篇草稿（`draft: true`），一篇都还没上线：12 篇 2026 年的项目稿，
  12 篇 2021–2025 的旧 devlog 补写稿（填 2019-09 到 2025-05 的空档），
  加 15 篇 2022–2024 的私人 vault 补写稿（填 2022-12 到 2025-04 的空档）。
  清单都在 `content-ops/README.md`。补写稿的数字全部来自私人笔记原文，
  **发布前需要本人核事实**。
- ⚠️ **两篇同名稿**：`2026-08-15-scad-kit-terrain` 和 `2026-08-29-scad-generation`
  标题都是《别让 AI 直接吐 3D 模型，让它写代码》。前者是拆成上下篇后的上篇
  （下篇是 `2026-08-22-scad-procedural-rig`），后者是早先的单篇版本。
  **两篇同名不能同时上线，需要作者决定留哪个。**
- 若干配图未产出，正文里是 `<!-- TODO 配图未产出 -->` 注释，清单在 `content-ops/README.md`。
- `src/data/site.ts` 里 `social` 的知乎 / B 站链接是推测的，尚未核对。
