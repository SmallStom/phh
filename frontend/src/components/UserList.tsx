import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FollowButton } from './FollowButton';
import { Loader2, UserX } from 'lucide-react';

interface User {
  id: string;
  username: string;
  avatar?: string;
  bio?: string;
}

interface FollowItem {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: User;
  following?: User;
}

interface UserListProps {
  users: FollowItem[];
  type: 'following' | 'followers';
  currentUserId?: string;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyText?: string;
  className?: string;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  type,
  currentUserId,
  loading = false,
  hasMore = false,
  onLoadMore,
  emptyText,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleUserClick = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  const getUser = (item: FollowItem): User | null => {
    if (type === 'following') {
      return item.following || null;
    } else {
      return item.follower || null;
    }
  };

  const defaultEmptyText = type === 'following' 
    ? '还没有关注任何人' 
    : '还没有粉丝';

  if (users.length === 0 && !loading) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
          <UserX className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
        <p className="text-[var(--text-muted)] text-center">
          {emptyText || defaultEmptyText}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {users.map((item, index) => {
        const user = getUser(item);
        if (!user) return null;

        const isSelf = currentUserId === user.id;

        return (
          <div
            key={`${item.id}-${index}`}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors group"
          >
            {/* 头像 */}
            <button
              onClick={() => handleUserClick(user.id)}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white font-medium flex-shrink-0 hover:opacity-90 transition-opacity"
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </button>

            {/* 用户信息 */}
            <div 
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => handleUserClick(user.id)}
            >
              <h4 className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-color)] transition-colors">
                {user.username}
              </h4>
              {user.bio && (
                <p className="text-sm text-[var(--text-muted)] truncate">
                  {user.bio}
                </p>
              )}
            </div>

            {/* 关注按钮 */}
            {!isSelf && (
              <FollowButton 
                userId={user.id} 
                size="sm" 
                variant="outline"
              />
            )}
          </div>
        );
      })}

      {/* 加载更多 */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                加载中...
              </span>
            ) : (
              '加载更多'
            )}
          </button>
        </div>
      )}

      {/* 加载中 */}
      {loading && users.length === 0 && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
        </div>
      )}
    </div>
  );
};
