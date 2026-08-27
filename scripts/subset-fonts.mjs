// 中文标题字体子集化。
//
// Noto Serif SC 全量一个字重接近 6 MB，即使按 unicode-range 切片，
// 首页也要拉 800+ kB —— 对从知乎点进来的手机用户是实打实的成本。
//
// 这里改成真子集：扫一遍 src/ 里所有会被渲染的文字，取并集，
// 把字体裁到只剩这些字。首页字体开销从 813 kB 降到几十 kB。
//
// 每次构建都重跑，所以新文章带进来的新字会自动被收进去 —— 不会出现豆腐块。
//
// 源字体不进仓库（.fonts-cache/ 已 gitignore），缺失时自动下载。

import fs from 'node:fs';
import path from 'node:path';
import subsetFont from 'subset-font';

const ROOT = process.cwd();
const CACHE = path.join(ROOT, '.fonts-cache');
const SRC_FONT = path.join(CACHE, 'NotoSerifSC-wght.ttf');
const SRC_URL =
  'https://github.com/google/fonts/raw/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf';

const OUT_FONT = path.join(ROOT, 'public/fonts/noto-serif-sc-subset.woff2');
const OUT_CSS = path.join(ROOT, 'src/styles/fonts/noto-serif-sc.css');

// 扫描范围：所有会变成页面文字的源文件
const SCAN_DIRS = ['src/content', 'src/data', 'src/components', 'src/pages', 'src/layouts'];
const SCAN_EXTS = new Set(['.md', '.mdx', '.astro', '.ts', '.tsx']);

const CJK = /[　-〿㐀-䶿一-鿿豈-﫿︰-﹏＀-￯]/;

function collectChars() {
  const chars = new Set();
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (SCAN_EXTS.has(path.extname(p))) {
        for (const ch of fs.readFileSync(p, 'utf8')) if (CJK.test(ch)) chars.add(ch);
      }
    }
  };
  SCAN_DIRS.forEach((d) => walk(path.join(ROOT, d)));

  // 一点余量：常用标点与全角数字字母，避免个别符号漏网
  for (const ch of '　、。〈〉《》「」『』【】〔〕〖〗！？，．：；‘’“”（）［］｛｝－—～·…０１２３４５６７８９％＃＆＊＋／＝＠') {
    chars.add(ch);
  }
  return chars;
}

async function ensureSource() {
  if (fs.existsSync(SRC_FONT)) return;
  fs.mkdirSync(CACHE, { recursive: true });
  console.log('· 下载源字体 NotoSerifSC[wght].ttf …');
  const res = await fetch(SRC_URL, { redirect: 'follow' });
  if (!res.ok) throw new Error(`源字体下载失败: HTTP ${res.status}`);
  fs.writeFileSync(SRC_FONT, Buffer.from(await res.arrayBuffer()));
}

await ensureSource();

const chars = collectChars();
const text = [...chars].join('');

const source = fs.readFileSync(SRC_FONT);
const subset = await subsetFont(source, text, {
  targetFormat: 'woff2',
  // 可变字体裁到单一字重，体积再降一截；600 是全站标题在用的重量
  variationAxes: { wght: { min: 600, max: 600, default: 600 } },
});

fs.mkdirSync(path.dirname(OUT_FONT), { recursive: true });
fs.writeFileSync(OUT_FONT, subset);

fs.mkdirSync(path.dirname(OUT_CSS), { recursive: true });
fs.writeFileSync(
  OUT_CSS,
  [
    '/* 由 scripts/subset-fonts.mjs 生成 —— 不要手改。',
    '   子集范围 = src/ 里出现过的全部中文字符，每次构建重新计算。',
    '   字重钉在 600 —— 中文标题不随 font-weight 变化，这是刻意的取舍：',
    '   多带一个字重就多一份体积，而 600 在全站标题上都成立。 */',
    '',
    '@font-face {',
    "  font-family: 'Noto Serif SC';",
    '  font-style: normal;',
    // 子集已钉死在 wght 600，字形不随请求变化。
    // 声明全区间是为了让任何 font-weight 都命中这一份，
    // 而不会因为落在声明区间外触发浏览器的伪粗体。
    '  font-weight: 100 900;',
    '  font-display: swap;',
    "  src: url('/fonts/noto-serif-sc-subset.woff2') format('woff2');",
    '}',
    '',
  ].join('\n'),
  'utf8',
);

const kb = (n) => (n / 1024).toFixed(0);
console.log(`✓ 中文子集：${chars.size} 字  ${kb(source.length)} kB → ${kb(subset.length)} kB`);
