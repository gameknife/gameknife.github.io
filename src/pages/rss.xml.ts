import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../data/site';
import { listedPosts, postUrl } from '../lib/posts';

// 全文输出：让 RSS 阅读器和聚合站直接拿到正文，而不是只给一句摘要。
export async function GET(context: APIContext) {
  const posts = await listedPosts();
  return rss({
    title: `${site.name_zh} / ${site.title}`,
    description: site.description,
    site: context.site ?? site.url,
    trailingSlash: true,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: postUrl(p),
      categories: [p.data.category, ...p.data.tags],
      content: p.body ?? '',
    })),
    customData: '<language>zh-CN</language>',
  });
}
