// 把 Web Font 落到本地，不依赖 Google Fonts。
//
// 为什么自托管：国内访问 fonts.googleapis.com 不稳定，字体拉不下来会退到系统字体，
// 中文标题就变回 SimSun —— 那正是这次要换掉的东西。
//
// 做法是镜像 Google 已经切好的 unicode-range 分片，而不是自己重新切：
// 中文 101 片，浏览器按页面实际用到的字符只取其中两三片，
// 首屏成本和一套西文字体差不多。
//
// 每个家族输出一份 CSS，各样式表只引自己要的 —— /cv/ 走系统 Helvetica 栈，一份都不引。
//
// 中文不在这里：Noto Serif SC 走 scripts/subset-fonts.mjs 做真子集，
// 全量镜像分片首页要拉 800+ kB，子集后整站只要一个 ~290 kB 的文件。
//
// 一次性脚本，字体版本要升级时重跑：node scripts/fetch-fonts.mjs

import fs from 'node:fs';
import path from 'node:path';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public/fonts');
const OUT_CSS_DIR = path.join(ROOT, 'src/styles/fonts');

const FAMILIES = [
  { slug: 'fraunces', query: 'Fraunces:opsz,wght,SOFT,WONK@9..144,400..800,0..100,0..1', note: '西文标题' },
  { slug: 'jetbrains-mono', query: 'JetBrains+Mono:wght@400;500;600', note: '等宽 / 展签' },
  // /resume/ 沿用旧站字体，同样不能依赖 Google 的可达性
  { slug: 'lora', query: 'Lora:wght@400;700', note: '简历页正文' },
  { slug: 'playfair-display', query: 'Playfair+Display:wght@400;700;900', note: '简历页标题' },
];

const HEADER = [
  '/* 由 scripts/fetch-fonts.mjs 生成 —— 不要手改。',
  '   字体文件自托管在 public/fonts/，不依赖 Google Fonts 的可达性。 */',
].join('\n');

const fetchCss = async (query) => {
  const res = await fetch(`https://fonts.googleapis.com/css2?family=${query}&display=swap`, {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`CSS ${query} -> HTTP ${res.status}`);
  return res.text();
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(OUT_CSS_DIR, { recursive: true });

let totalFiles = 0;
let totalBytes = 0;

for (const fam of FAMILIES) {
  const css = await fetchCss(fam.query);
  const dir = path.join(OUT_DIR, fam.slug);
  fs.mkdirSync(dir, { recursive: true });

  const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) ?? [])];
  const map = new Map();
  let n = 0;
  let famBytes = 0;

  for (const url of urls) {
    const name = `${fam.slug}-${String(++n).padStart(3, '0')}.woff2`;
    const dest = path.join(dir, name);
    if (!fs.existsSync(dest)) {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    }
    famBytes += fs.statSync(dest).size;
    map.set(url, `/fonts/${fam.slug}/${name}`);
  }

  let local = css;
  for (const [remote, localPath] of map) local = local.replaceAll(remote, localPath);

  const out = [HEADER, '', `/* ${fam.note} · ${n} 个分片 */`, local.trim(), ''].join('\n');
  fs.writeFileSync(path.join(OUT_CSS_DIR, `${fam.slug}.css`), out, 'utf8');

  totalFiles += n;
  totalBytes += famBytes;
  console.log(`✓ ${fam.slug.padEnd(16)} ${String(n).padStart(3)} 片   ${(famBytes / 1024 / 1024).toFixed(2)} MB`);
}

console.log('\n✓ src/styles/fonts/*.css');
console.log(`  合计 ${totalFiles} 个文件 / ${(totalBytes / 1024 / 1024).toFixed(1)} MB（浏览器按 unicode-range 只取命中的分片）`);
