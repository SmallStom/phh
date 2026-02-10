import React, { useState, useRef, useEffect } from 'react';
import { mentionsApi, MentionUser } from '../../api/mentions';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value = '',
  onChange,
  placeholder = '输入内容，使用 @ 提及用户',
  className = '',
  rows = 3
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [mentionStart, setMentionStart] = useState(-1);

  // 从API响应中提取用户列表
  const extractUsers = (response: any): MentionUser[] => {
    console.log('Extracting users from:', response);
    
    // 如果 response 是 Axios 响应对象，获取 response.data
    const data = response?.data || response;
    
    console.log('Data to extract:', data);
    
    // 处理不同的返回格式
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.data)) {
      return data.data;
    } else if (data && data.success && Array.isArray(data.data)) {
      return data.data;
    }
    
    return [];
  };

  // 加载推荐用户
  const loadUsers = async () => {
    try {
      console.log('Loading suggested users...');
      const response = await mentionsApi.getSuggestedUsers(10);
      console.log('Raw response:', response);
      
      const userList = extractUsers(response);
      console.log('Extracted user list:', userList);
      
      setUsers(userList);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  };

  // 搜索用户
  const searchUsers = async (query: string) => {
    try {
      console.log('Searching users for:', query);
      const response = await mentionsApi.searchUsers(query, 10);
      console.log('Search response:', response);
      
      const userList = extractUsers(response);
      console.log('Search result:', userList);
      
      setUsers(userList);
    } catch (error) {
      console.error('Failed to search users:', error);
      setUsers([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    
    // 检查是否在输入 @
    const textBefore = newValue.slice(0, cursorPos);
    const atIndex = textBefore.lastIndexOf('@');
    
    if (atIndex !== -1) {
      const afterAt = textBefore.slice(atIndex + 1);
      // 检查 @ 后面是否只有字母数字中文（没有空格）
      if (/^[\w\u4e00-\u9fff]*$/.test(afterAt)) {
        setMentionStart(atIndex);
        setShowUserList(true);
        if (afterAt) {
          searchUsers(afterAt);
        } else {
          loadUsers();
        }
      } else {
        setShowUserList(false);
      }
    } else {
      setShowUserList(false);
    }
  };

  const selectUser = (user: MentionUser) => {
    if (mentionStart >= 0) {
      const before = value.slice(0, mentionStart);
      const after = value.slice(textareaRef.current?.selectionStart || 0);
      const newValue = `${before}@${user.username} ${after}`;
      onChange(newValue);
      setShowUserList(false);
      
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!textareaRef.current?.contains(e.target as Node)) {
        setShowUserList(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-4 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        style={{
          backgroundColor: 'var(--bg-card, white)',
          borderColor: 'var(--border-color, #e5e7eb)',
          color: 'var(--text-primary, #374151)',
        }}
      />
      
      {showUserList && (
        <div className="absolute z-50 mt-1 w-64 max-h-48 overflow-y-auto rounded-lg shadow-lg border border-gray-200 bg-white">
          <div className="px-3 py-2 text-xs text-gray-600 border-b border-gray-200 font-medium">
            选择用户
          </div>
          {!Array.isArray(users) || users.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              暂无用户
            </div>
          ) : (
            <ul className="py-1">
              {users.map((user, index) => (
                <li
                  key={user.id || index}
                  onClick={() => selectUser(user)}
                  className="px-4 py-2 cursor-pointer hover:bg-blue-50 flex items-center gap-3 transition-colors"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                      {user.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user.username || '未知用户'}
                    </div>
                    {user.relation && (
                      <div className="text-xs text-blue-500 mt-0.5">
                        {user.relation}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
