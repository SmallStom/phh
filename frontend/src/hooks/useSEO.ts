import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
}

/**
 * SEO 组件 - 动态更新页面的 meta 标签和 Open Graph 信息
 * 在 SPA 中替代 SSR 的 SEO 方案
 */
export const useSEO = ({
  title = '美好广场 - 发现和分享美好的瞬间',
  description = '记录生活、展示经历、收藏兴趣，打造属于你的个人空间。在美好广场发现有趣的内容，与志同道合的人分享美好瞬间。',
  keywords = '美好广场,个人记录,生活分享,时间轴,收藏,社区,广场',
  image,
  type = 'website',
  author,
  publishedTime,
}: SEOProps = {}) => {
  const location = useLocation();
  const siteUrl = 'https://ysypjf.cn';
  const ogImage = image || `${siteUrl}/favicon.svg`;

  useEffect(() => {
    // 基础 meta
    document.title = title;

    setMeta('description', description);
    setMeta('keywords', keywords);

    // Open Graph
    setMetaProperty('og:title', title);
    setMetaProperty('og:description', description);
    setMetaProperty('og:type', type);
    setMetaProperty('og:url', `${siteUrl}${location.pathname}`);
    setMetaProperty('og:image', ogImage);
    setMetaProperty('og:site_name', '美好广场');
    setMetaProperty('og:locale', 'zh_CN');

    if (type === 'article' && author) {
      setMetaProperty('article:author', author);
    }
    if (type === 'article' && publishedTime) {
      setMetaProperty('article:published_time', publishedTime);
    }

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${siteUrl}${location.pathname}`;

  }, [title, description, keywords, ogImage, type, author, publishedTime, location.pathname]);
};

function setMeta(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function setMetaProperty(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.content = content;
}
