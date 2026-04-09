import React, { useEffect, useState } from 'react';

/**
 * Sitemap 生成组件
 * 在前端动态生成 sitemap.xml 内容
 * 注意：这只是辅助方案，理想情况下应该在后端生成静态 sitemap
 */

// 站点静态页面
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

// 在 App.tsx 中不需要渲染此组件
// 它仅用于生成 sitemap 内容，请使用后端 API 路由提供 sitemap

export const generateSitemapXml = (dynamicUrls?: Array<{
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}>): string => {
  const urls = [
    ...STATIC_PAGES.map(page => ({
      loc: `${SITE_URL}${page.path}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: page.changefreq,
      priority: page.priority,
    })),
    ...(dynamicUrls || []).map(url => ({
      loc: url.loc.startsWith('http') ? url.loc : `${SITE_URL}${url.loc}`,
      lastmod: url.lastmod || new Date().toISOString().split('T')[0],
      changefreq: url.changefreq || 'weekly',
      priority: url.priority || '0.6',
    })),
  ];

  const xmlUrls = urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;
};
