import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

const isProd = import.meta.env.PROD;

/** 文章的最终 URL。存量文章按 legacyUrl 原样出页，新文章走 /blog/{slug}/。 */
export function postUrl(post: Post): string {
  return post.data.legacyUrl ?? `/blog/${post.id}/`;
}

/** 所有可访问的文章（含 unlisted，它们有 URL 只是不进列表）。draft 仅在开发时可见。 */
export async function allPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => !isProd || !data.draft);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** 进列表 / RSS / 搜索的文章：排除 unlisted 残稿与原 hidden 分类。 */
export async function listedPosts(): Promise<Post[]> {
  return (await allPosts()).filter((p) => !p.data.unlisted);
}

export async function featuredPosts(limit = 3): Promise<Post[]> {
  const listed = await listedPosts();
  const picked = listed.filter((p) => p.data.featured);
  // 没标 featured 就退回最新几篇，首页永远不会空着
  return (picked.length ? picked : listed).slice(0, limit);
}

export async function allTags(): Promise<{ tag: string; count: number }[]> {
  const counts = new Map<string, number>();
  for (const p of await listedPosts()) {
    for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** 同分类下时间最接近的几篇，用于文章页底部 */
export async function relatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const listed = (await listedPosts()).filter((p) => p.id !== post.id);
  const sameTag = listed.filter((p) => p.data.tags.some((t) => post.data.tags.includes(t)));
  const sameCat = listed.filter((p) => p.data.category === post.data.category);
  const seen = new Set<string>();
  return [...sameTag, ...sameCat, ...listed]
    .filter((p) => !seen.has(p.id) && seen.add(p.id))
    .slice(0, limit);
}

const CN = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
export const formatDate = (d: Date) => CN.format(d);
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** 中英混排的粗略阅读时长：中文按字算，西文按词算 */
export function readingTime(body: string): number {
  const cjk = (body.match(/[一-鿿]/g) ?? []).length;
  const words = (body.replace(/[一-鿿]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 220));
}
