import React from 'react';

interface HtmlContentProps {
  content: string;
  className?: string;
  lineClamp?: 1 | 2 | 3 | 4 | 5;
}

/**
 * 简单的 Markdown 到 HTML 转换函数
 * 支持：标题、粗体、斜体、删除线、链接、列表、代码块、引用等
 */
const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';

  let html = markdown;

  // 转义 HTML 特殊字符（防止 XSS）
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 代码块 (```code```)
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // 行内代码 (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 标题 (### Title)
  html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
  html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 粗体 (**text** 或 __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // 斜体 (*text* 或 _text_)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // 删除线 (~~text~~)
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // 链接 ([text](url))
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // 无序列表 (- item 或 * item)
  html = html.replace(/^\s*[-*] (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // 有序列表 (1. item)
  html = html.replace(/^\s*\d+\. (.*$)/gim, '<li>$1</li>');

  // 引用 (> text)
  html = html.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');

  // 水平线 (--- 或 *** 或 ___)
  html = html.replace(/^(---|\*\*\*|___)\s*$/gim, '<hr />');

  // 段落（将剩余的行包裹在 <p> 标签中）
  // 先分割成行
  const lines = html.split('\n');
  const result: string[] = [];
  let inParagraph = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 如果已经是块级元素，直接添加
    if (
      line.startsWith('<h') ||
      line.startsWith('<ul') ||
      line.startsWith('</ul') ||
      line.startsWith('<li') ||
      line.startsWith('</li') ||
      line.startsWith('<blockquote') ||
      line.startsWith('</blockquote') ||
      line.startsWith('<pre') ||
      line.startsWith('</pre') ||
      line.startsWith('<hr') ||
      line === ''
    ) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      if (line !== '') {
        result.push(line);
      }
    } else {
      // 行内内容
      if (!inParagraph) {
        result.push('<p>');
        inParagraph = true;
      }
      result.push(line);
    }
  }

  if (inParagraph) {
    result.push('</p>');
  }

  html = result.join('\n');

  // 将连续的 <p> 标签内的换行转换为 <br>
  html = html.replace(/<p>([\s\S]*?)<\/p>/g, (match, content) => {
    const withBr = content.replace(/\n/g, '<br />');
    return `<p>${withBr}</p>`;
  });

  return html;
};

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
    /^&gt; /m,             // 引用
    /`.*?`/,               // 行内代码
    /^```/m,               // 代码块
  ];

  return markdownPatterns.some(pattern => pattern.test(content));
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
