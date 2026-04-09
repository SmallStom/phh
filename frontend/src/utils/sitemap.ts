/**
 * Sitemap 生成工具函数
 * 注意：实际 sitemap.xml 由后端动态生成（/sitemap.xml）
 * 此工具函数用于前端辅助场景
 */

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/records', priority: '0.8', changefreq: 'daily' },
  { path: '/experiences', priority: '0.7', changefreq: 'weekly' },
  { path: '/collections', priority: '0.7', changefreq: 'weekly' },
  { path: '/search', priority: '0.5', changefreq: 'daily' },
  { path: '/login', priority: '0.3', changefreq: 'monthly' },
  { path: '/register', priority: '0.3', changefreq: 'monthly' },
];

const SITE_URL = 'https://ysypjf.cn';

export interface DynamicUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export const generateSitemapXml = (dynamicUrls?: DynamicUrl[]): string => {
  const urls = [
    ...STATIC_PAGES.map((page) => ({
      loc: `${SITE_URL}${page.path}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: page.changefreq,
      priority: page.priority,
    })),
    ...(dynamicUrls || []).map((url) => ({
      loc: url.loc.startsWith('http') ? url.loc : `${SITE_URL}${url.loc}`,
      lastmod: url.lastmod || new Date().toISOString().split('T')[0],
      changefreq: url.changefreq || 'weekly',
      priority: url.priority || '0.6',
    })),
  ];

  const xmlUrls = urls
    .map(
      (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;
};
