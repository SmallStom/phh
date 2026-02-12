import React from 'react';

interface HtmlContentProps {
  content: string;
  className?: string;
  lineClamp?: 1 | 2 | 3 | 4 | 5;
}

export const HtmlContent: React.FC<HtmlContentProps> = ({ content, className = '', lineClamp }) => {
  if (!content) {
    return null;
  }

  const lineClampClass = lineClamp ? `line-clamp-${lineClamp}` : '';

  return (
    <div 
      className={`html-content ${lineClampClass} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
