// 一次性迁移：把 PersonalMarketing 里的知乎稿转成站点的博客草稿。
// 已跑完，留作记录 —— 和 migrate-posts.mjs 同一性质。
//
// 做四件事：抽标题、补 frontmatter、把本地图片路径改到 src/assets/blog/、
// 把尚未产出的配图降级成 TODO 注释（留成 ![]() 会让 astro build 解析失败）。

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = '/Users/gameknife/github/PersonalMarketing';
const OUT = 'src/content/blog';
const ASSETS = 'src/assets/blog';

/** 已经搬进 src/assets/blog/ 的图；不在表里的按缺图处理。 */
const MIGRATED = new Set([
  'oceanball.gif',
  'gkengine-conf-room.webp',
  'gknextengine-conf-room.jpg',
  'img-repo-card-gknextengine.png',
  'img-pathtracing-luxball.webp',
  'img-scad-terrain-editor.webp',
  'img-scad-nextdayz.webp',
  'img-magicalego-mlscript.webp',
  'img-scad-terrain-features.webp',
]);

/** 旧站 Jekyll 时期的绝对图床链接，现在这些图就在仓库里。 */
const REMOTE_REWRITES = {
  'https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/indoor2.jpg':
    '../../assets/blog/indoor2.jpg',
};

const ARTICLES = [
  {
    from: 'zhihu/2026-07-18-01-gkengine-rewrite.md',
    slug: '2026-07-18-gkengine-rewrite',
    date: '2026-07-18',
    tags: ['gkNextEngine', 'vulkan', '引擎'],
    featured: true,
    zhihu: 'https://zhuanlan.zhihu.com/p/2042766137314784589',
    description:
      '2010 年代我写过一款个人 3D 引擎 gkEngine。2024 年重新开始，面对的是 Slang、Bindless、Ray Query 和 code agent —— 这是推倒重写之后的 gkNextEngine，以及它留下的六个问题。',
  },
  {
    from: 'zhihu/2026-07-25-02-full-bindless.md',
    slug: '2026-07-25-full-bindless',
    date: '2026-07-25',
    tags: ['gkNextEngine', 'vulkan', 'bindless', '渲染架构'],
    description:
      '不是字面意义上的绑定调用归零，而是把 buffer 全部改成按地址访问、纹理全部进全局数组。真正消失的不是某一条 API，是散落在整个渲染器里的接线关系。',
  },
  {
    from: 'zhihu/2026-08-01-03-imgui-bindless.md',
    slug: '2026-08-01-imgui-bindless',
    date: '2026-08-01',
    tags: ['gkNextEngine', 'vulkan', 'imgui', 'bindless'],
    description:
      '编辑器里最后一个按传统纹理绑定工作的子系统是 ImGui。官方 backend 没写错，只是它的资源模型和引擎已有的全局纹理身份对不上，于是我接管了它的 Vulkan renderer。',
  },
  {
    from: 'zhihu/2026-08-08-04-gpu-driven-dynamic-spheres.md',
    slug: '2026-08-08-gpu-driven-dynamic-spheres',
    date: '2026-08-08',
    tags: ['gkNextEngine', 'vulkan', 'gpu-driven', 'benchmark'],
    description:
      '旧稿里那个「8192 个球 @1000fps」在当前仓库里没有可复现的场景和报告，所以不写。这一篇只给 2026-07-15 在 M3 Max 上重新跑出来的数字，附命令和 CSV。',
  },
  {
    from: 'zhihu/2026-08-15-02-scad-kit-terrain.md',
    slug: '2026-08-15-scad-kit-terrain',
    date: '2026-08-15',
    tags: ['gkNextEngine', 'ai-agent', 'openscad', '程序化生成'],
    description:
      '生成得像不像，看一眼就知道；生成完能不能改，得等三个月后策划说「这个门再宽半米」的时候才知道。上篇：为什么是 OpenSCAD，以及零件库和地面怎么做。',
  },
  {
    from: 'zhihu/2026-08-15-05-ai-agent-engineering.md',
    slug: '2026-08-15-ai-agent-engineering',
    date: '2026-08-15',
    tags: ['gkNextEngine', 'ai-agent', '工程方法'],
    description:
      '时间预算和十几年前写 gkEngine 时没有本质区别，精力甚至更差。但 2026 年之后开发速度完全变了 —— 609 次提交、144 个活跃开发日背后，code agent 到底在做什么。',
  },
  {
    from: 'zhihu/2026-08-22-03-scad-procedural-rig.md',
    slug: '2026-08-22-scad-procedural-rig',
    date: '2026-08-22',
    tags: ['gkNextEngine', 'openscad', '程序化生成', '动画'],
    description:
      '零件和地面都已经是纯文本，但东西还是死的。这篇讲怎么把零件按规则铺满一平方公里，以及怎么让文本描述的角色动起来，最后在 NextDayz 的 416 行文件里合体。',
  },
  {
    from: 'zhihu/2026-08-22-06-engine-core-refactor.md',
    slug: '2026-08-22-engine-core-refactor',
    date: '2026-08-22',
    tags: ['gkNextEngine', 'ai-agent', '重构'],
    description:
      '九条 commit，Engine core 从 55,279 行降到 36,161 行。这是一次分阶段、每步都能对上 commit 的重构实录，包括哪些只是纯移动、哪些是真的删掉了东西。',
  },
  {
    from: 'zhihu/2026-08-29-07-scad-generation.md',
    slug: '2026-08-29-scad-generation',
    date: '2026-08-29',
    tags: ['gkNextEngine', 'ai-agent', 'openscad', '程序化生成'],
    description:
      'mesh、体素、NeRF、Gaussian Splatting 解决的问题各不相同。我关心的是怎么生成一个能进工程、还能继续改的资产 —— 绕一圈之后，答案是让它写 OpenSCAD。',
  },
  {
    from: 'zhihu/2026-09-05-08-runtime-llm.md',
    slug: '2026-09-05-runtime-llm',
    date: '2026-09-05',
    tags: ['gkNextEngine', 'llm', '游戏ai'],
    description:
      '服务断了怎么办，回答慢了怎么办，输出不合法怎么办，几十个人同时想说话怎么办。AirportSim 里 LLM 只参与「接下来想做什么」，世界能否继续运转留在普通代码里。',
  },
  {
    from: 'softrenderer/2026-07-28-01-tiled-renderer.md',
    slug: '2026-07-28-softrenderer-tiled-renderer',
    date: '2026-07-28',
    tags: ['SoftRenderer', 'cpu渲染', '多线程', '优化'],
    description:
      '一款十多年前写的 CPU 软件渲染器，854×480 的 Sponza 对照从约 48.03 FPS 变成 100.20 FPS。不是换了 GPU —— 变的是 CPU 怎么分工、怎么等待、一帧里的数据归谁写。',
  },
  {
    from: 'gkengine/2026-07-29-01-revive-toolchain.md',
    slug: '2026-07-29-gkengine-revive-toolchain',
    date: '2026-07-29',
    tags: ['gkEngine', '遗留工程', '工具链', 'd3d9'],
    description:
      '一个老引擎能不能重新运行，代码可能只占一半；另一半是它周围那套已经被时间拆散的工具链。这次先接通一条走到 conf_room 的路径，再沿着真正跑出来的画面逐层修。',
  },
];

/** frontmatter 里的字符串统一用双引号，内部的双引号转义。 */
const q = (s) => `"${s.replace(/"/g, '\\"')}"`;

let missing = 0;

for (const a of ARTICLES) {
  const raw = readFileSync(join(SRC, a.from), 'utf8');
  const lines = raw.split('\n');

  const h1 = lines.findIndex((l) => l.startsWith('# '));
  if (h1 === -1) throw new Error(`${a.from} 没有 # 标题`);
  const title = lines[h1].slice(2).trim();
  if (title.length > 80) throw new Error(`${a.from} 标题超过 80 字：${title}`);

  // 去掉标题行，以及紧随其后的空行与 --- 分隔线（知乎稿的排版习惯，
  // 站点上标题由 Post.astro 渲染，正文开头再来一条横线是多余的）。
  let body = lines.slice(h1 + 1);
  while (body.length && (body[0].trim() === '' || body[0].trim() === '---')) body.shift();
  body = body.join('\n').trimEnd();

  for (const [url, local] of Object.entries(REMOTE_REWRITES)) {
    body = body.split(url).join(local);
  }

  body = body.replace(/!\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (m, alt, path, tail) => {
    if (/^(https?:)?\/\//.test(path) || path.startsWith('/') || path.startsWith('..')) return m;
    const name = path.replace(/^\.\//, '');
    if (MIGRATED.has(name)) return `![${alt}](../../${ASSETS.replace('src/', '')}/${name}${tail ?? ''})`;
    missing++;
    console.log(`  缺图 ${a.slug}: ${name}`);
    return `<!-- TODO 配图未产出：${name}（${alt}）。补图放进 src/assets/blog/ 后改回 ![${alt}](../../assets/blog/${name}） -->`;
  });

  const fm = [
    '---',
    `title: ${q(title)}`,
    `date: ${a.date}`,
    'category: tech',
    `description: ${q(a.description)}`,
    `tags: [${a.tags.map(q).join(', ')}]`,
    'draft: true',
    ...(a.featured ? ['featured: true'] : []),
    ...(a.zhihu ? [`zhihu: ${q(a.zhihu)}`] : []),
    '---',
    '',
  ].join('\n');

  const dest = join(OUT, `${a.slug}.md`);
  if (existsSync(dest)) throw new Error(`${dest} 已存在，不覆盖`);
  writeFileSync(dest, `${fm}${body}\n`);
  console.log(`✓ ${a.slug}  ← ${a.from}`);
}

console.log(`\n${ARTICLES.length} 篇已转为草稿，${missing} 处配图待补。`);
