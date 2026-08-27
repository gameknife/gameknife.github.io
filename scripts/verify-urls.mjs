// 历史 URL 回归防线。CI 里跑，少一个就让构建失败。
//
// 期望值不是从迁移后的 frontmatter 读的 —— 那样等于自己证明自己。
// 它直接从原始 _posts/ 的文件名与 category 重新推导一遍 Jekyll 的
// pretty permalink，再和 dist/ 的实际产物比对。两条独立路径对上了才算数。
//
// 用法：node scripts/verify-urls.mjs [dist目录]

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, process.argv[2] ?? 'dist');
const LEGACY_POSTS = path.join(ROOT, '_posts');
const SNAPSHOT = path.join(ROOT, 'scripts/legacy-urls.json');

/** 复刻 Jekyll `permalink: pretty` + categories 的行为 */
function expectedUrls() {
  if (!fs.existsSync(LEGACY_POSTS)) return null;
  const urls = [];
  for (const file of fs.readdirSync(LEGACY_POSTS)) {
    if (file.startsWith('.')) continue;
    const m = file.replace(/\.(md|markdown)$/i, '').match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
    if (!m) continue;
    const [, y, mo, d, slug] = m;

    const raw = fs.readFileSync(path.join(LEGACY_POSTS, file), 'utf8').replace(/\r\n/g, '\n');
    const end = raw.startsWith('---') ? raw.indexOf('\n---', 3) : -1;
    const fm = end > -1 ? raw.slice(3, end) : '';
    const cat = fm.match(/^[ \t]*category[ \t]*:[ \t]*(.*)$/m)?.[1].trim().toLowerCase() || '';

    urls.push(cat ? `/${cat}/${y}/${mo}/${d}/${slug}/` : `/${y}/${mo}/${d}/${slug}/`);
  }
  return urls.sort();
}

// _posts/ 清理掉之后，靠快照继续守。
let expected = expectedUrls();
if (expected) {
  fs.writeFileSync(SNAPSHOT, JSON.stringify(expected, null, 2) + '\n');
} else if (fs.existsSync(SNAPSHOT)) {
  expected = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
  console.log('· 源目录 _posts/ 已移除，改用 scripts/legacy-urls.json 快照');
} else {
  console.error('✗ 既没有 _posts/ 也没有快照，无法校验');
  process.exit(1);
}

if (!fs.existsSync(DIST)) {
  console.error(`✗ 找不到构建产物：${DIST}（先跑 astro build）`);
  process.exit(1);
}

const missing = expected.filter((u) => !fs.existsSync(path.join(DIST, u, 'index.html')));

console.log(`历史 URL 校验：${expected.length - missing.length} / ${expected.length} 命中`);
if (missing.length) {
  console.error(`\n✗ 以下 ${missing.length} 个历史路径在产物中缺失，会造成死链：\n`);
  for (const u of missing) console.error(`    ${u}`);
  console.error('\n  这些链接在线上已经存在多年，不能丢。检查对应文章的 legacyUrl。\n');
  process.exit(1);
}

// 顺带检查几个关键新路由，防止改路由时无声打断
const critical = ['/', '/blog/', '/engine/', '/works/', '/resume/', '/cv/', '/about/', '/404.html'];
const brokenNew = critical.filter((u) => {
  const p = u.endsWith('.html') ? path.join(DIST, u) : path.join(DIST, u, 'index.html');
  return !fs.existsSync(p);
});
if (brokenNew.length) {
  console.error(`✗ 关键页面缺失：${brokenNew.join(', ')}`);
  process.exit(1);
}

console.log('✓ 全部命中，关键页面齐全');
