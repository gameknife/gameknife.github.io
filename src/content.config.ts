import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1).max(80),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      category: z.enum(['tech', 'life', 'art']),
      tags: z.array(z.string()).default([]),

      // 必填：同时喂给列表摘要、<meta description>、OG 图和 RSS。
      // 缺一个就是四处破面，所以不给默认值。
      description: z.string().min(10).max(200),

      cover: image().optional(),
      coverAlt: z.string().optional(),

      draft: z.boolean().default(false),
      featured: z.boolean().default(false),

      // 存量文章的线上原始路径。有值就按它出页，一个字节都不能变。
      legacyUrl: z.string().startsWith('/').endsWith('/').optional(),

      // 残稿与原 hidden 分类：保留 URL 不破链，但不进列表 / RSS / 搜索。
      unlisted: z.boolean().default(false),

      // 知乎同步链接，渲染成文章页的双向导流入口。
      zhihu: z.string().url().optional(),
    }),
});

const works = defineCollection({
  loader: glob({ base: './src/content/works', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      year: z.string(),
      group: z.enum(['graphics', 'cg', 'painting', 'photo']),
      image: image(),
      alt: z.string(),
      note: z.string().optional(),
      order: z.number().default(0),
    }),
});

export const collections = { blog, works };
