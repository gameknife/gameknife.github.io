// 把构建产物里的 /cv/ 打印成 PDF，落到 dist/KaimingYi-CV.pdf。
//
// 数据源是 src/data/cv.ts —— 改一行 push 一次，网页版和 PDF 一起变，
// 不会再出现「网页更新了、发出去的 PDF 还是旧的」。
//
// 本地没装 playwright 时跳过（只警告不失败），CI 里装了就会真的生成。

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(DIST, 'KaimingYi-CV.pdf');
const PORT = 4322;

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.warn('· 未安装 playwright，跳过 PDF 生成（CI 中会执行）');
  process.exit(0);
}

if (!fs.existsSync(path.join(DIST, 'cv', 'index.html'))) {
  console.error('✗ dist/cv/index.html 不存在，先跑 astro build');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.json': 'application/json',
};

// 起一个最小静态服务器 —— file:// 下相对路径和字体加载都会出问题
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(DIST, p);
  if (!file.startsWith(DIST)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end('not found');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/cv/`, { waitUntil: 'networkidle' });
  // cv.css 里所有颜色规则都锁在 @media screen 内，打印时天然走纸张版；
  // 这里仍显式切浅色，避免任何残留的暗色变量渗进来。
  await page.emulateMedia({ media: 'print', colorScheme: 'light' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.waitForTimeout(400);

  // 页面尺寸与页边距以 cv.css 的 @page 为准（A4 / 14mm 15mm），
  // 不要在这里再传 margin，否则会和样式表打架。
  await page.pdf({
    path: OUT,
    printBackground: true,
    preferCSSPageSize: true,
  });

  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log(`✓ ${path.relative(ROOT, OUT)}  (${kb} kB)`);
} finally {
  await browser.close();
  server.close();
}
