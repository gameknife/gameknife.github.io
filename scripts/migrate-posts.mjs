// 一次性迁移：_posts/ + images/ + assets/  ->  src/content/blog/ + src/assets/blog/
//
// 做七件事（对应方案 §05）：
//   1. 搬运正文，给缺扩展名的文件补 .md
//   2. 从文件名解析日期写进 frontmatter（Astro 不像 Jekyll 会读文件名）
//   3. 补缺失的 title，归一化 category 的空格问题
//   4. 写入 legacyUrl —— 存量文章的线上真实路径，一个字节都不能变
//   5. 图片绝对 URL -> 相对引用，并把图拷进 src/assets/blog/
//   6. 从首段抽 description 草稿（必须人工复核）
//   7. 输出迁移报告当 checklist
//
// 幂等：重复运行结果一致。

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IN_POSTS = path.join(ROOT, '_posts');
const OUT_POSTS = path.join(ROOT, 'src/content/blog');
const OUT_IMG = path.join(ROOT, 'src/assets/blog');
const REPORT = path.join(ROOT, 'scripts/migration-report.md');

// 正文里出现的图片前缀，全部指向本仓库
const RAW_PREFIX =
  /https?:\/\/raw\.githubusercontent\.com\/gameknife\/gameknife\.github\.io\/(?:master|main)\//g;

/** 文件名里的 = + 等字符会让打包器和 URL 都不舒服，统一剥掉 */
const sanitize = (p) =>
  p
    .split('/')
    .map((seg) => seg.replace(/[=+%\s]/g, ''))
    .join('/');

/** 极简 frontmatter 解析：只需要 title / category，不引第三方依赖 */
function splitFrontmatter(raw) {
  const text = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  if (!text.startsWith('---')) return { fm: '', body: text };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { fm: '', body: text };
  return {
    fm: text.slice(3, end).replace(/^\n/, ''),
    body: text.slice(end + 4).replace(/^\n+/, ''),
  };
}

/** `category : life` / `category: life ` 都要能读出来 */
function fmValue(fm, key) {
  const m = fm.match(new RegExp(`^[ \\t]*${key}[ \\t]*:[ \\t]*(.*)$`, 'm'));
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, '') || null;
}

/** 从正文抽一段能当摘要的文字 */
function deriveDescription(body) {
  const lines = body.split('\n');
  const parts = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (/^!\[/.test(t)) continue;            // 图片
    if (/^>/.test(t)) continue;              // 引用
    if (/^#{1,6}\s/.test(t)) continue;       // 标题
    if (/^(-{3,}|={3,}|\*{3,})$/.test(t)) continue; // 分隔线
    if (/^<[a-z!/]/i.test(t)) continue;      // 裸 HTML（本站只有 <br>）
    if (/^```/.test(t)) break;               // 到代码块就停
    if (/^[-*+]\s|^\d+\.\s/.test(t)) continue; // 列表项不适合当摘要

    const clean = t
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // 链接留文字
      .replace(/[*_`~]/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (clean.length < 8) continue;
    parts.push(clean);
    if (parts.join('').length > 60) break;
  }

  let d = parts.join(' ').trim();
  if (!d) return '';
  if (d.length > 120) {
    // 尽量断在标点上，别把句子拦腰砍断
    const cut = d.slice(0, 118);
    const at = Math.max(
      cut.lastIndexOf('。'), cut.lastIndexOf('，'), cut.lastIndexOf('；'),
      cut.lastIndexOf('！'), cut.lastIndexOf('？'), cut.lastIndexOf('. '),
    );
    d = (at > 40 ? cut.slice(0, at + 1) : cut) + '…';
  }
  return d.replace(/"/g, "'");
}

/** 补 title：先找正文一级标题，再退回 slug */
function deriveTitle(body, slug) {
  const h = body.match(/^#{1,3}\s+(.+)$/m);
  if (h && h[1].trim().length > 1) return h[1].trim();
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const yamlStr = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// ── 主流程 ────────────────────────────────────────────────────────────────
fs.mkdirSync(OUT_POSTS, { recursive: true });
fs.mkdirSync(OUT_IMG, { recursive: true });

const files = fs.readdirSync(IN_POSTS).filter((f) => !f.startsWith('.'));
const rows = [];
const copiedImages = new Set();
const missingImages = new Set();

for (const file of files) {
  const notes = [];

  // 1 · 缺扩展名的补上（2015-12-06-reenter-minecraft-world 十年没被发布过）
  let base = file;
  if (!/\.(md|markdown)$/i.test(base)) {
    base = `${base}.md`;
    notes.push('**补了 .md 扩展名（此前从未上线）**');
  }

  const m = base.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.(md|markdown)$/i);
  if (!m) {
    rows.push({ file, skipped: true, notes: ['文件名不符合 YYYY-MM-DD-slug 规则，已跳过'] });
    continue;
  }
  const [, yyyy, mm, dd, slug] = m;

  const raw = fs.readFileSync(path.join(IN_POSTS, file), 'utf8');
  const { fm, body: rawBody } = splitFrontmatter(raw);

  // 3 · category 归一化
  let category = fmValue(fm, 'category');
  if (category) category = category.toLowerCase().trim();
  let unlisted = false;
  if (category === 'hidden') {
    // 保住 URL，但和现在的 Jekyll 一样不出现在列表里
    unlisted = true;
    notes.push('原 `hidden` 分类 → `unlisted: true`（保留 URL，不进列表/RSS）');
  }

  // 4 · legacyUrl —— 必须与线上完全一致
  const legacyUrl = category
    ? `/${category}/${yyyy}/${mm}/${dd}/${slug}/`
    : `/${yyyy}/${mm}/${dd}/${slug}/`;
  if (!category) {
    notes.push('原本无 category，URL 不含分类段 —— 已保留，另补 `category` 仅供站内归档');
  }

  const archiveCategory = unlisted ? 'tech' : category || 'tech';

  // 3 · title
  let title = fmValue(fm, 'title');
  if (!title) {
    title = deriveTitle(rawBody, slug);
    notes.push(`**原本缺 title，自动补为「${title}」—— 需人工确认**`);
  }

  // 5 · 图片：绝对 URL -> 相对引用，并把文件拷过去
  let body = rawBody.replace(RAW_PREFIX, '');
  body = body.replace(
    /!\[([^\]]*)\]\(\s*((?:images|assets)\/[^\s)]+)((?:\s+"[^"]*")?)\s*\)/g,
    (whole, alt, rel, titleAttr) => {
      const srcAbs = path.join(ROOT, decodeURIComponent(rel));
      if (!fs.existsSync(srcAbs)) {
        missingImages.add(rel);
        return whole; // 留原样，报告里点名
      }
      // images/foo.jpg -> foo.jpg ; assets/bar.gif -> bar.gif ; 子目录保留
      const relInside = sanitize(rel.replace(/^(images|assets)\//, ''));
      const destAbs = path.join(OUT_IMG, relInside);
      fs.mkdirSync(path.dirname(destAbs), { recursive: true });
      if (!copiedImages.has(relInside)) {
        fs.copyFileSync(srcAbs, destAbs);
        copiedImages.add(relInside);
      }
      return `![${alt}](../../assets/blog/${relInside}${titleAttr})`;
    },
  );

  // 6 · description
  const description = deriveDescription(body);
  if (!description) notes.push('**抽不出摘要，必须手写 description**');
  else if (description.length < 24) notes.push('摘要偏短，建议重写');

  // 2 · 日期进 frontmatter
  const out = [
    '---',
    `title: ${yamlStr(title)}`,
    `date: ${yyyy}-${mm}-${dd}`,
    `category: ${archiveCategory}`,
    `description: ${yamlStr(description || title)}`,
    'tags: []',
    `legacyUrl: ${yamlStr(legacyUrl)}`,
    ...(unlisted ? ['unlisted: true'] : []),
    '---',
    '',
    body.trimEnd(),
    '',
  ].join('\n');

  fs.writeFileSync(path.join(OUT_POSTS, `${yyyy}-${mm}-${dd}-${slug}.md`), out, 'utf8');
  rows.push({ file, slug, date: `${yyyy}-${mm}-${dd}`, category: archiveCategory, legacyUrl, description, notes, unlisted });
}

// 7 · 报告
const done = rows.filter((r) => !r.skipped);
const flagged = done.filter((r) => r.notes.length);

const report = [
  '# 迁移报告',
  '',
  `生成时间：${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
  '',
  `- 迁移文章：**${done.length}** 篇（源目录 ${files.length} 个文件）`,
  `- 拷贝图片：**${copiedImages.size}** 张 → \`src/assets/blog/\``,
  `- 需人工复核：**${flagged.length}** 篇`,
  missingImages.size ? `- 引用了但文件不存在的图：**${missingImages.size}** 张` : '',
  '',
  '## 需人工复核',
  '',
  ...(flagged.length
    ? flagged.flatMap((r) => [
        `### ${r.date} · \`${r.slug}\``,
        ...r.notes.map((n) => `- ${n}`),
        '',
      ])
    : ['无。', '']),
  ...(missingImages.size
    ? ['## 失效图片引用（已保留原样，需手工处理）', '', ...[...missingImages].map((i) => `- \`${i}\``), '']
    : []),
  '## 全部文章',
  '',
  '| 日期 | 分类 | legacyUrl | 摘要 |',
  '|---|---|---|---|',
  ...done.map(
    (r) =>
      `| ${r.date} | ${r.category}${r.unlisted ? ' ·unlisted' : ''} | \`${r.legacyUrl}\` | ${
        (r.description || '—').slice(0, 44)
      } |`,
  ),
  '',
].filter((l) => l !== '');

fs.writeFileSync(REPORT, report.join('\n'), 'utf8');

console.log(`✓ 迁移 ${done.length} 篇文章`);
console.log(`✓ 拷贝 ${copiedImages.size} 张图片`);
if (missingImages.size) console.log(`! ${missingImages.size} 张图片引用失效`);
console.log(`! ${flagged.length} 篇需人工复核 —— 见 scripts/migration-report.md`);
