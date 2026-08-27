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
