// 构建期为每篇文章生成 1200x630 分享图。
// 链接贴到知乎 / 微信 / Twitter 时的第一印象 —— 老站点这里是一张空白卡片。
import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';
import { site } from '../../data/site';

const posts = await getCollection('blog');

const pages: Record<string, { title: string; description: string; kicker: string }> = {
  default: { title: `${site.name_zh} / ${site.title}`, description: site.headline, kicker: site.url.replace(/^https?:\/\//, '') },
};

for (const p of posts) {
  pages[p.id] = {
    title: p.data.title,
    description: p.data.description,
    kicker: `${site.categories[p.data.category].label} · ${p.data.date.getFullYear()}`,
  };
}

export const { getStaticPaths, GET } = OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (_path, page: (typeof pages)[string]) => ({
    title: page.title,
    description: page.description,
    logo: undefined,
    bgGradient: [[12, 15, 20], [28, 35, 46]],
    border: { color: [224, 168, 75], width: 12, side: 'inline-start' },
    padding: 72,
    font: {
      title: { size: 62, weight: 'Bold', color: [235, 240, 248], lineHeight: 1.22, families: ['Noto Sans SC', 'Archivo', 'sans-serif'] },
      description: { size: 28, weight: 'Normal', color: [150, 162, 180], lineHeight: 1.45, families: ['Noto Sans SC', 'IBM Plex Sans', 'sans-serif'] },
    },
    fonts: [
      'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-700-normal.ttf',
      'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-400-normal.ttf',
    ],
  }),
});
