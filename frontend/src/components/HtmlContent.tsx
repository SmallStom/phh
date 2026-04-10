import React from 'react';
import { marked } from 'marked';

interface HtmlContentProps {
  content: string;
  className?: string;
  lineClamp?: 1 | 2 | 3 | 4 | 5;
}

/**
 * 检测内容是否为 Markdown 格式
 */
const isMarkdown = (content: string): boolean => {
  // 检测常见的 Markdown 语法
  const markdownPatterns = [
    /^#{1,6} /m,           // 标题
    /\*\*.*?\*\*/,         // 粗体
    /\*.*?\*/,             // 斜体
    /__.*?__/,             // 粗体
    /_.*?_/,               // 斜体
    /~~.*?~~/,             // 删除线
    /\[.*?\]\(.*?\)/,      // 链接
    /^\s*[-*] /m,          // 无序列表
    /^\s*\d+\. /m,         // 有序列表
    /^> /m,                // 引用
    /`.*?`/,               // 行内代码
    /^```/m,               // 代码块
  ];

  return markdownPatterns.some(pattern => pattern.test(content));
};

/**
 * 将 Markdown 转换为 HTML
 */
const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';

  // 配置 marked 选项
  marked.setOptions({
    breaks: true,        // 将换行符转换为 <br>
    gfm: true,           // 启用 GitHub Flavored Markdown
  });

  return marked.parse(markdown) as string;
};

export const HtmlContent: React.FC<HtmlContentProps> = ({ content, className = '', lineClamp }) => {
  if (!content) {
    return null;
  }

  const lineClampClass = lineClamp ? `line-clamp-${lineClamp}` : '';

  // 检测内容是否为 Markdown，如果是则转换
  const htmlContent = isMarkdown(content) ? markdownToHtml(content) : content;

  return (
    <div
      className={`html-content ${lineClampClass} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
