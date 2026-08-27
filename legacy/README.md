# Jekyll 遗留物

本目录是 2015–2025 年 Jekyll 站点的原始文件，重构后已不参与构建。
保留在这里只为方便核对，确认无误后可以整个删掉：

    git rm -r legacy/

内容去向：
- `_posts/`  → `src/content/blog/`（44 篇，URL 全部保留，见 scripts/legacy-urls.json）
- `_data/`   → `src/data/cv.ts` 与 `src/data/resume.ts`（已剥离 `<lis>` 等混入的 HTML 标签）
- `images/`  → `src/assets/works/`（作品集）与 `src/assets/blog/`（文章配图）
- `assets/`  → `src/assets/blog/`（3 个动图，其中 2 个已转成动画 WebP）
- `CNAME`    → 原本是空文件，已废弃；将来启用自定义域名时在 `public/` 下新建
