import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MentionTextProps {
  content: string;
  className?: string;
}

export const MentionText: React.FC<MentionTextProps> = ({
  content,
  className = ''
}) => {
  const navigate = useNavigate();

  // 解析 @用户名
  const parts = content.split(/(@[\w\u4e00-\u9fff]+)/g);

  const handleMentionClick = (username: string) => {
    // 移除 @ 符号
    const cleanUsername = username.slice(1);
    // 跳转到用户主页（使用新的路由 /users/by-username/:username）
    navigate(`/users/by-username/${cleanUsername}`);
  };

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          return (
            <span
              key={index}
              onClick={() => handleMentionClick(part)}
              className="cursor-pointer font-medium hover:underline"
              style={{
                color: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                padding: '1px 4px',
                borderRadius: '4px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
              title="点击查看用户主页"
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};
