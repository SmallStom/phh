import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { followsApi } from '../api/follows';
import { usersApi } from '../api/users';
import { useAuthStore } from '../store/authStore';
import { UserList } from '../components/UserList';
import { ArrowLeft } from 'lucide-react';
import type { Follow } from '../api/follows';

export const FollowingList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  
  // 如果没有 id 参数，使用当前用户的 id
  const userId = id || currentUser?.id;
  
  const [following, setFollowing] = useState<Follow[]>([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const isSelf = currentUser?.id === userId;
  const pageSize = 20;

  useEffect(() => {
    if (userId) {
      loadUserInfo();
      loadFollowing();
    }
  }, [userId]);

  const loadUserInfo = async () => {
    try {
      const userData = await usersApi.getUserProfile(userId!);
      setUsername(userData.username);
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const loadFollowing = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await followsApi.getFollowing(userId!, pageNum, pageSize);
      const data = response.data;
      
      if (pageNum === 1) {
        setFollowing(data.data);
      } else {
        setFollowing(prev => [...prev, ...data.data]);
      }
      
      setTotal(data.total);
      setHasMore(data.data.length === pageSize && following.length + data.data.length < data.total);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load following:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadFollowing(page + 1);
    }
  };

  const handleBack = () => {
    if (id) {
      // 如果是从用户资料页进入，返回用户资料页
      navigate(`/users/${id}`);
    } else {
      // 如果是从个人中心进入，返回个人中心
      navigate('/profile');
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {isSelf ? '我的关注' : `${username}的关注`}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              共 {total} 人
            </p>
          </div>
        </div>

        {/* User List */}
        <div className="card p-4">
          <UserList
            users={following}
            type="following"
            currentUserId={currentUser?.id}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            emptyText={isSelf ? '你还没有关注任何人' : '该用户还没有关注任何人'}
          />
        </div>
      </div>
    </div>
  );
};
