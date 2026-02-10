import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { followsApi } from '../api/follows';
import { useAuthStore } from '../store/authStore';

interface FollowButtonProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  size = 'md',
  variant = 'default',
  onFollowChange,
  className = '',
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // 不能关注自己
  const isSelf = user?.id === userId;

  useEffect(() => {
    if (!isAuthenticated || isSelf) {
      setChecking(false);
      return;
    }

    checkFollowStatus();
  }, [userId, isAuthenticated, isSelf]);

  const checkFollowStatus = async () => {
    try {
      setChecking(true);
      const response = await followsApi.checkFollowStatus(userId);
      setIsFollowing(response.data.is_following);
    } catch (error) {
      console.error('Failed to check follow status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      // 触发登录弹窗或跳转登录页
      window.dispatchEvent(new CustomEvent('show-login-modal'));
      return;
    }

    if (loading || checking) return;

    setLoading(true);
    try {
      if (isFollowing) {
        await followsApi.unfollow(userId);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await followsApi.follow(userId);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      // 可以添加 toast 提示
    } finally {
      setLoading(false);
    }
  };

  // 如果是自己，不显示按钮
  if (isSelf) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const variantClasses = {
    default: isFollowing
      ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
      : 'bg-[var(--accent-color)] text-white hover:opacity-90',
    outline: isFollowing
      ? 'border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
      : 'border border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[var(--accent-color)] hover:text-white',
    ghost: isFollowing
      ? 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
      : 'text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10',
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading || checking}
      className={`
        inline-flex items-center gap-1.5 rounded-lg font-medium
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {loading || checking ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="w-4 h-4" />
          <span>已关注</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>关注</span>
        </>
      )}
    </button>
  );
};
