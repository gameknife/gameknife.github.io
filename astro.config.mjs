// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';

// 站点 URL 是唯一真源，将来换自定义域名只改这一行（外加 public/CNAME）。
export const SITE_URL = 'https://gameknife.github.io';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',       // 对齐 Jekyll pretty permalink，保住历史链接
  build: { format: 'directory' },

  // 旧站的栏目页。文章 URL 原样保留了，但这四个栏目页在新架构里没有对应物，
  // 不接住就是 404 —— /gallery/ 是作品集入口，最可能有外链。
  // GitHub Pages 发不了真 301，Astro 会生成 meta-refresh + canonical 的静态页，
  // 搜索引擎按重定向处理。
  redirects: {
    '/gallery/': '/works/',
    '/art/': '/works/',
    '/tech/': '/blog/',
    '/life/': '/blog/',
  },
  integrations: [
    mdx(),
    sitemap({ filter: (p) => !p.includes('/og/') }),
  ],
  vite: {
    plugins: [tailwind()],
    build: { rollupOptions: { external: ['/pagefind/pagefind.js'] } },
  },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      wrap: true,
    },
  },
  image: {
    // 老文章里的图尺寸参差，统一交给 sharp 生成 webp/avif
    responsiveStyles: true,
  },
});
