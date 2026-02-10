import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FollowButton } from './FollowButton';
import { Users, FileText, Bookmark } from 'lucide-react';

interface UserProfileCardProps {
  user: {
    id: string;
    username: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
    following_count?: number;
    followers_count?: number;
    records_count?: number;
  };
  showFollowButton?: boolean;
  compact?: boolean;
  className?: string;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  showFollowButton = true,
  compact = false,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/users/${user.id}`);
  };

  const handleNavigateToFollowing = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/users/${user.id}/following`);
  };

  const handleNavigateToFollowers = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/users/${user.id}/followers`);
  };

  if (compact) {
    return (
      <div
        onClick={handleNavigate}
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors ${className}`}
      >
        {/* 头像 */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white font-medium flex-shrink-0">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
          ) : (
            user.username.charAt(0).toUpperCase()
          )}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[var(--text-primary)] truncate">
            {user.username}
          </h4>
          {user.bio && (
            <p className="text-xs text-[var(--text-muted)] truncate">
              {user.bio}
            </p>
          )}
        </div>

        {/* 关注按钮 */}
        {showFollowButton && (
          <FollowButton userId={user.id} size="sm" variant="outline" />
        )}
      </div>
    );
  }

  return (
    <div className={`card p-6 ${className}`}>
      {/* 头部信息 */}
      <div className="flex items-start gap-4">
        {/* 头像 */}
        <div
          onClick={handleNavigate}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white text-2xl font-medium cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
          ) : (
            user.username.charAt(0).toUpperCase()
          )}
        </div>

        {/* 用户信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3
                onClick={handleNavigate}
                className="text-xl font-semibold text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-color)] transition-colors"
              >
                {user.username}
              </h3>
              {user.location && (
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  📍 {user.location}
                </p>
              )}
            </div>

            {showFollowButton && (
              <FollowButton userId={user.id} size="md" variant="default" />
            )}
          </div>

          {/* 简介 */}
          {user.bio && (
            <p className="text-[var(--text-secondary)] mt-3 line-clamp-2">
              {user.bio}
            </p>
          )}

          {/* 网站链接 */}
          {user.website && (
            <a
              href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--accent-color)] hover:underline mt-2 inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              🔗 {user.website}
            </a>
          )}
        </div>
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--border-color)]">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-[var(--text-muted)] mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-xs">记录</span>
          </div>
          <p className="text-xl font-semibold text-[var(--text-primary)]">
            {user.records_count || 0}
          </p>
        </div>

        <button
          onClick={handleNavigateToFollowing}
          className="text-center hover:bg-[var(--bg-secondary)] rounded-lg py-2 transition-colors"
        >
          <div className="flex items-center justify-center gap-1 text-[var(--text-muted)] mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">关注</span>
          </div>
          <p className="text-xl font-semibold text-[var(--text-primary)]">
            {user.following_count || 0}
          </p>
        </button>

        <button
          onClick={handleNavigateToFollowers}
          className="text-center hover:bg-[var(--bg-secondary)] rounded-lg py-2 transition-colors"
        >
          <div className="flex items-center justify-center gap-1 text-[var(--text-muted)] mb-1">
            <Bookmark className="w-4 h-4" />
            <span className="text-xs">粉丝</span>
          </div>
          <p className="text-xl font-semibold text-[var(--text-primary)]">
            {user.followers_count || 0}
          </p>
        </button>
      </div>
    </div>
  );
};
