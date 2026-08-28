import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ASSETS_DIR = path.resolve('src/assets/blog');
const CONTENT_DIR = path.resolve('src/content/blog');

// Ensure directories exist
fs.mkdirSync(ASSETS_DIR, { recursive: true });
fs.mkdirSync(CONTENT_DIR, { recursive: true });

// 25 articles to migrate
const ARTICLES = [
  {
    date: '2015-02-09',
    time: '10:00',
    title: 'gkENGINE重开！',
    slug: '2015-02-09-gkengine-restart',
    category: 'tech',
    tags: ['gkEngine', '游戏引擎', '开源'],
    url: 'https://www.cnblogs.com/gameknife/p/3809235.html'
  },
  {
    date: '2013-04-27',
    time: '00:23',
    title: 'gkENGINE跨平台的问题总结',
    slug: '2013-04-27-gkengine-cross-platform',
    category: 'tech',
    tags: ['gkEngine', '跨平台', 'C++', 'CMake'],
    url: 'https://www.cnblogs.com/gameknife/archive/2013/04/27/3046136.html'
  },
  {
    date: '2013-04-26',
    time: '23:57',
    title: 'gkENGINE HDR流程简析',
    slug: '2013-04-26-gkengine-hdr-pipeline',
    category: 'tech',
    tags: ['gkEngine', '渲染', 'HDR', '后处理'],
    url: 'https://www.cnblogs.com/gameknife/archive/2013/04/26/3046110.html'
  },
  {
    date: '2013-04-22',
    time: '21:38',
    title: 'gkENGINE 开发两年半总结（上）',
    slug: '2013-04-22-gkengine-two-and-half-years',
    category: 'tech',
    tags: ['gkEngine', '游戏引擎', '渲染', '架构'],
    url: 'https://www.cnblogs.com/gameknife/archive/2013/04/22/3026138.html'
  },
  {
    date: '2012-11-28',
    time: '22:48',
    title: '以前的一些画',
    slug: '2012-11-28-paintings-archive',
    category: 'art',
    tags: ['绘画', '板绘', '随笔'],
    url: 'https://www.cnblogs.com/gameknife/archive/2012/11/28/2793539.html'
  },
  {
    date: '2012-10-25',
    time: '11:35',
    title: '新的开始',
    slug: '2012-10-25-new-beginning',
    category: 'life',
    tags: ['随笔', '生活', '工作'],
    url: 'https://www.cnblogs.com/gameknife/archive/2012/10/25/2738473.html'
  },
  {
    date: '2012-02-17',
    time: '12:11',
    title: '#九阴真经#优选配置渲染流程简要分析[Flexi引擎]',
    slug: '2012-02-17-age-of-wushu-flexi-render-pipeline',
    category: 'tech',
    tags: ['九阴真经', 'Flexi引擎', '渲染', '图形学'],
    url: 'https://www.cnblogs.com/gameknife/archive/2012/02/17/2355570.html'
  },
  {
    date: '2012-02-03',
    time: '20:50',
    title: '利用D3DQUERY实现简单的GPU计时器',
    slug: '2012-02-03-d3dquery-gpu-timer',
    category: 'tech',
    tags: ['DirectX', 'Direct3D', 'GPU', '性能分析'],
    url: 'https://www.cnblogs.com/gameknife/archive/2012/02/03/2337539.html'
  },
  {
    date: '2011-11-30',
    time: '02:21',
    title: 'gkENGINE - 个人图形引擎展示',
    slug: '2011-11-30-gkengine-showcase',
    category: 'tech',
    tags: ['gkEngine', '游戏引擎', '渲染', 'DirectX'],
    url: 'https://www.cnblogs.com/gameknife/archive/2011/11/30/2268509.html'
  },
  {
    date: '2011-10-19',
    time: '22:58',
    title: '工作半年 - 总结',
    slug: '2011-10-19-half-year-work-summary',
    category: 'life',
    tags: ['工作', '总结', '随笔'],
    url: 'https://www.cnblogs.com/gameknife/archive/2011/10/19/2218259.html'
  },
  {
    date: '2011-04-26',
    time: '01:00',
    title: '毕设开发总结-3D游戏框架及网络对战游戏的开发(2)',
    slug: '2011-04-26-graduation-project-summary-2',
    category: 'tech',
    tags: ['毕设', '3D游戏框架', '网络对战', '游戏引擎'],
    url: 'https://www.cnblogs.com/gameknife/archive/2011/04/26/2028790.html'
  },
  {
    date: '2011-04-25',
    time: '00:41',
    title: '毕设开发总结-3D游戏框架及网络对战游戏的开发(1)',
    slug: '2011-04-25-graduation-project-summary-1',
    category: 'tech',
    tags: ['毕设', '3D游戏框架', '渲染', '游戏开发'],
    url: 'https://www.cnblogs.com/gameknife/archive/2011/04/25/2025663.html'
  },
  {
    date: '2011-04-19',
    time: '10:51',
    title: '随便写点',
    slug: '2011-04-19-random-thoughts',
    category: 'life',
    tags: ['随笔', '生活', '毕业'],
    url: 'https://www.cnblogs.com/gameknife/archive/2011/04/19/2020623.html'
  },
  {
    date: '2010-12-28',
    time: '01:20',
    title: 'GameKnifeEngine第一个游戏<TANK 3D> Demo版完成！',
    slug: '2010-12-28-tank3d-demo-finish',
    category: 'tech',
    tags: ['GameKnifeEngine', 'Tank3D', '游戏开发', 'C++'],
    url: 'https://www.cnblogs.com/gameknife/archive/2010/12/28/1918448.html'
  },
  {
    date: '2010-12-05',
    time: '22:42',
    title: '基于3dsMax的地图编辑器设想',
    slug: '2010-12-05-3dsmax-map-editor-design',
    category: 'tech',
    tags: ['3dsMax', '关卡编辑器', '地图编辑器', '游戏开发'],
    url: 'https://www.cnblogs.com/gameknife/archive/2010/12/05/1897247.html'
  },
  {
    date: '2010-09-20',
    time: '23:18',
    title: '入驻cnBlogs!',
    slug: '2010-09-20-join-cnblogs',
    category: 'life',
    tags: ['随笔', '博客园', '博客'],
    url: 'https://www.cnblogs.com/gameknife/archive/2010/09/20/1832143.html'
  },
  {
    date: '2010-06-18',
    time: '00:55',
    title: 'Tank2010_alpha完成，项目完工！',
    slug: '2010-06-18-tank2010-alpha-finish',
    category: 'tech',
    tags: ['Tank2010', '游戏开发', 'DirectX', 'C++'],
    url: 'https://www.cnblogs.com/gameknife/archive/2010/06/18/1832155.html'
  },
  {
    date: '2010-06-07',
    time: '02:46',
    title: '关卡管理器构建完成，用脚本控制整个游戏流程！',
    slug: '2010-06-07-level-manager-script-workflow',
    category: 'tech',
    tags: ['关卡管理', 'Lua', '脚本系统', '游戏开发'],
    url: 'https://www.cnblogs.com/gameknife/archive/2010/06/07/1832156.html'
  },
  {
    date: '2010-06-02',
    time: '02:59',
    title: 'Mock up! 基本游戏功能全部实现！',
    slug: '2010-06-02-tank-mockup-features',
    category: 'tech',
    tags: ['游戏开发', 'Tank', 'AI', '摄像机'],
    url: 'https://www.cnblogs.com/gameknife/archive/2010/06/02/1832157.html'
  },
  {
    date: '2010-05-30',
    time: '15:15',
    title: '基于脚本的简单AI和摄像机系统',
    slug: '2010-05-30-script-ai-camera-system',
    category: 'tech',
    tags: ['Lua', 'AI', '摄像机', '脚本系统'],
    url: 'https://www.cnblogs.com/gameknife/archive/2010/05/30/1832158.html'
  },
  {
    date: '2010-05-29',
    time: '11:44',
    title: 'Behavior脚本系统',
    slug: '2010-05-29-behavior-script-system',
    category: 'tech',
    tags: ['Behavior', 'Lua', '脚本系统', '架构'],
    url: 'https://www.cnblogs.com/gameknife/archive/2010/05/29/1832159.html'
  },
  {
    date: '2010-05-25',
    time: '16:05',
    title: '场景编辑器竣工！',
    slug: '2010-05-25-scene-editor-complete',
    category: 'tech',
    tags: ['场景编辑器', 'UI', '游戏开发', 'MFC'],
    url: 'https://www.cnblogs.com/gameknife/archive/2010/05/25/1832161.html'
  },
  {
    date: '2010-05-18',
    time: '15:59',
    title: 'Multisample & ShadowMap & PostProcess冲突解决',
    slug: '2010-05-18-msaa-shadowmap-postprocess-resolve',
    category: 'tech',
    tags: ['DirectX', 'MSAA', 'ShadowMap', '后处理', '渲染'],
    url: 'https://www.cnblogs.com/gameknife/archive/2010/05/18/1832162.html'
  },
  {
    date: '2010-05-15',
    time: '23:43',
    title: '基础ShadowMap实现',
    slug: '2010-05-15-basic-shadowmap-implementation',
    category: 'tech',
    tags: ['DirectX', 'ShadowMap', '阴影', '渲染'],
    url: 'https://www.cnblogs.com/gameknife/archive/2010/05/15/1832163.html'
  },
  {
    date: '2010-05-13',
    time: '23:10',
    title: 'GameKnife_0.9.6 渲染系统初步竣工!',
    slug: '2010-05-13-gameknife-096-rendering-system',
    category: 'tech',
    tags: ['GameKnifeEngine', 'DirectX', '渲染', 'Shader'],
    url: 'https://www.cnblogs.com/gameknife/archive/2010/05/13/1832164.html'
  }
];

function decodeHtml(html) {
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000)
      });
      if (res.ok) return res;
      if (res.status === 403 || res.status === 404 || res.status === 502) {
        return res; // no point retrying fatal upstream errors
      }
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

async function downloadAndConvertImage(imgUrl, slug, index) {
  let fullUrl = imgUrl;
  if (fullUrl.startsWith('//')) fullUrl = 'https:' + fullUrl;

  try {
    const res = await fetchWithRetry(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.cnblogs.com/'
      }
    });

    if (!res.ok) {
      console.warn(`[IMAGE FAIL ${res.status}] ${fullUrl}`);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    let baseName = '';
    const urlObj = new URL(fullUrl);
    const pathname = urlObj.pathname;
    const match = pathname.match(/([^/]+)\.(jpg|jpeg|png|gif|bmp|webp)$/i);
    if (match) {
      baseName = match[1];
    } else {
      baseName = `${slug}-img-${index}`;
    }

    baseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetFilename = `${slug}-${baseName}.webp`;
    const targetPath = path.join(ASSETS_DIR, targetFilename);

    const webpBuffer = await sharp(inputBuffer)
      .webp({ quality: 80 })
      .toBuffer();

    fs.writeFileSync(targetPath, webpBuffer);
    console.log(`[IMAGE OK] ${fullUrl} -> ${targetFilename} (${webpBuffer.length} bytes, from ${inputBuffer.length} bytes)`);
    return targetFilename;
  } catch (err) {
    console.warn(`[IMAGE ERROR] ${fullUrl}: ${err.message}`);
    return null;
  }
}

async function htmlToMarkdown(html, article) {
  const codeBlocks = [];

  // Remove cnblogs toolbar (e.g. copy code buttons)
  let processedHtml = html.replace(/<div class="cnblogs_code_toolbar">[\s\S]*?<\/div>/gi, '');

  // Match cnblogs code block wrapper: <div class="cnblogs_code"> ... </div> (handling nested divs properly)
  processedHtml = processedHtml.replace(/<div class="cnblogs_code"[\s\S]*?(?:<\/pre>\s*<\/div>\s*<\/div>|<\/div>\s*<\/div>)/gi, (match) => {
    const titleMatch = match.match(/class="cnblogs_code_collapse">([^<]+)<\/span>/i);
    const collapseTitle = titleMatch ? titleMatch[1].trim() : '';

    const preMatch = match.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    let codeContent = preMatch ? preMatch[1] : match;

    codeContent = codeContent
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '');

    codeContent = decodeHtml(codeContent);

    // Clean line numbers
    const lines = codeContent.split('\n');
    const cleanedLines = lines.map(line => line.replace(/^\s*\d+[\.\:]\s?/, ''));
    codeContent = cleanedLines.join('\n').trim();

    let lang = 'cpp';
    if (collapseTitle.endsWith('.lua') || (codeContent.includes('function') && codeContent.includes('end') && !codeContent.includes('{'))) {
      lang = 'lua';
    } else if (collapseTitle.endsWith('.xml') || codeContent.startsWith('<?xml') || (codeContent.startsWith('<') && codeContent.endsWith('>'))) {
      lang = 'xml';
    } else if (collapseTitle.endsWith('.hlsl') || collapseTitle.endsWith('.fx')) {
      lang = 'hlsl';
    } else if (collapseTitle.endsWith('.cs')) {
      lang = 'csharp';
    }

    const placeholder = `%%%CODE_BLOCK_${codeBlocks.length}%%%`;
    let blockMd = '';
    if (collapseTitle) {
      blockMd += `**\`${collapseTitle}\`**\n\n`;
    }
    blockMd += `\`\`\`${lang}\n${codeContent}\n\`\`\``;
    codeBlocks.push(blockMd);
    return `\n\n${placeholder}\n\n`;
  });

  // Standalone <pre> blocks
  processedHtml = processedHtml.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, inner) => {
    let lang = 'cpp';
    const brushMatch = match.match(/class=["\x27]brush:\s*([a-zA-Z0-9#+]+)/i);
    if (brushMatch) {
      const b = brushMatch[1].toLowerCase();
      if (b === 'c#' || b === 'csharp') lang = 'csharp';
      else if (b === 'cpp' || b === 'c++') lang = 'cpp';
      else if (b === 'xml' || b === 'html') lang = 'xml';
      else if (b === 'lua') lang = 'lua';
      else if (b === 'hlsl' || b === 'fx') lang = 'hlsl';
    }

    let codeContent = inner
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    codeContent = decodeHtml(codeContent);

    const lines = codeContent.split('\n');
    const cleanedLines = lines.map(line => line.replace(/^\s*\d+[\.\:]\s?/, ''));
    codeContent = cleanedLines.join('\n').trim();

    if (codeContent.includes('function') && codeContent.includes('end') && !codeContent.includes('{')) {
      lang = 'lua';
    }

    const placeholder = `%%%CODE_BLOCK_${codeBlocks.length}%%%`;
    codeBlocks.push(`\`\`\`${lang}\n${codeContent}\n\`\`\``);
    return `\n\n${placeholder}\n\n`;
  });

  // Images
  const imgMatches = [...processedHtml.matchAll(/<img[^>]*src=["\x27]([^"\x27]+)["\x27][^>]*>/gi)];
  let imgIndex = 1;
  for (const imgMatch of imgMatches) {
    const fullTag = imgMatch[0];
    const src = imgMatch[1];
    
    // Ignore cnblogs outlining icons
    if (src.includes('OutliningIndicators') || src.includes('ContractedBlock') || src.includes('ExpandedBlockStart')) {
      processedHtml = processedHtml.replace(fullTag, '');
      continue;
    }

    const altMatch = fullTag.match(/alt=["\x27]([^"\x27]*)["\x27]/i);
    const alt = altMatch ? altMatch[1].trim() : '';

    const webpFilename = await downloadAndConvertImage(src, article.slug, imgIndex++);
    if (webpFilename) {
      processedHtml = processedHtml.replace(fullTag, `\n\n![${alt || 'image'}](../../assets/blog/${webpFilename})\n\n`);
    } else {
      const placeholder = `%%%CODE_BLOCK_${codeBlocks.length}%%%`;
      const desc = alt ? ` · ${alt}` : '';
      codeBlocks.push(`<div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效${desc}）</div>`);
      processedHtml = processedHtml.replace(fullTag, `\n\n${placeholder}\n\n`);
    }
  }

  // Headings
  processedHtml = processedHtml
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => `\n\n# ${c.trim()}\n\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => `\n\n## ${c.trim()}\n\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => `\n\n### ${c.trim()}\n\n`)
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, c) => `\n\n#### ${c.trim()}\n\n`)
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_, c) => `\n\n##### ${c.trim()}\n\n`)
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_, c) => `\n\n###### ${c.trim()}\n\n`);

  // Blockquotes
  processedHtml = processedHtml.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, c) => {
    const text = c.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n').trim();
    const lines = text.split('\n').map(l => `> ${l.trim()}`).join('\n');
    return `\n\n${lines}\n\n`;
  });

  // Paragraphs & Divs & Linebreaks
  processedHtml = processedHtml
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => `\n\n${c.trim()}\n\n`)
    .replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, (_, c) => `\n\n${c.trim()}\n\n`)
    .replace(/<br\s*\/?>/gi, '\n\n');

  // Lists
  processedHtml = processedHtml
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `\n- ${c.trim()}`)
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n');

  // Inline formatting
  processedHtml = processedHtml
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<a[^>]*href=["\x27]([^"\x27]+)["\x27][^>]*>([\s\S]*?)<\/a>/gi, (_, u, t) => `[${t.trim()}](${u.trim()})`);

  // Remove remaining tags
  processedHtml = processedHtml.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  processedHtml = decodeHtml(processedHtml);

  // Restore code blocks and custom blocks
  for (let i = 0; i < codeBlocks.length; i++) {
    processedHtml = processedHtml.replace(`%%%CODE_BLOCK_${i}%%%`, codeBlocks[i]);
  }

  // Normalize excessive newlines and whitespace
  processedHtml = processedHtml
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return processedHtml;
}

function generateDescription(markdownContent, title) {
  let text = markdownContent
    .replace(/<div class="img-lost"[\s\S]*?<\/div>/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/[#*`_>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length < 15) {
    text = `${title}。回顾早期开发与技术实践记录。`;
  }

  if (text.length > 150) {
    text = text.slice(0, 147) + '...';
  }

  return text;
}

async function migrateArticle(article) {
  console.log(`\n========================================`);
  console.log(`Migrating: [${article.date}] ${article.title}`);
  console.log(`URL: ${article.url}`);

  const res = await fetchWithRetry(article.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch article page: ${article.url} (status: ${res.status})`);
  }

  const html = await res.text();
  const startIdx = html.indexOf('id="cnblogs_post_body"');
  if (startIdx === -1) {
    throw new Error(`Could not find id="cnblogs_post_body" for: ${article.url}`);
  }
  const postBodyStart = html.indexOf('>', startIdx) + 1;
  let postBodyEnd = html.indexOf('<div id="MySignature">', postBodyStart);
  if (postBodyEnd === -1) {
    postBodyEnd = html.indexOf('<div id="blog_post_info_block"', postBodyStart);
  }
  if (postBodyEnd === -1) {
    postBodyEnd = html.indexOf('</div>', postBodyStart);
  }

  const rawBody = html.slice(postBodyStart, postBodyEnd);
  const markdownBody = await htmlToMarkdown(rawBody, article);
  const description = generateDescription(markdownBody, article.title);

  const frontmatter = [
    '---',
    `title: "${article.title.replace(/"/g, '\\"')}"`,
    `date: ${article.date}`,
    `category: ${article.category}`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    `tags: [${article.tags.map(t => `"${t}"`).join(', ')}]`,
    'draft: false',
    '---',
    ''
  ].join('\n');

  const fileContent = `${frontmatter}\n${markdownBody}\n`;
  const targetFilePath = path.join(CONTENT_DIR, `${article.slug}.md`);

  fs.writeFileSync(targetFilePath, fileContent, 'utf8');
  console.log(`[SAVED] ${targetFilePath} (${fileContent.length} chars)`);
}

async function main() {
  console.log(`Starting migration of ${ARTICLES.length} articles from cnblogs...`);
  let successCount = 0;
  for (const article of ARTICLES) {
    try {
      await migrateArticle(article);
      successCount++;
    } catch (err) {
      console.error(`[MIGRATION FAILED] ${article.title}:`, err);
    }
  }
  console.log(`\nMigration completed: ${successCount}/${ARTICLES.length} successful.`);
}

main();
