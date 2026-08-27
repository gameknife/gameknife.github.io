import type { APIContext } from 'astro';
import { site } from '../data/site';

export function GET(_context: APIContext) {
  return new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /og/',
      '',
      `Sitemap: ${site.url}/sitemap-index.xml`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}
