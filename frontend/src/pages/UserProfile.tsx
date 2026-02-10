import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { recordsApi } from '../api/records';
import { experiencesApi } from '../api/experiences';
import { collectionsApi } from '../api/collections';
import { useAuthStore } from '../store/authStore';
import { FollowButton } from '../components/FollowButton';
import { HtmlContent } from '../components/HtmlContent';
import { formatDateTime } from '../utils/dateUtils';
import { 
  Loader2, FileText, Bookmark, Award, 
  MapPin, Link as LinkIcon, Calendar 
} from 'lucide-react';
import type { User, UserStats } from '../types/auth';
import type { Record as UserRecord } from '../types/record';
import type { Experience } from '../types/experience';
import type { Collection } from '../types/collection';

type TabType = 'records' | 'experiences' | 'collections';

export const UserProfile: React.FC = () => {
  const { id, username } = useParams<{ id: string; username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  
  const [user, setUser] = useState<(User & UserStats) | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('records');
  const [records, setRecords] = useState<UserRecord[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [contentLoading, setContentLoading] = useState(false);

  const isSelf = currentUser?.id === user?.id;

  useEffect(() => {
    if (id || username) {
      loadUserProfile();
    }
  }, [id, username]);

  useEffect(() => {
    if (user) {
      loadTabContent();
    }
  }, [activeTab, user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      let userData;
      if (username) {
        // 通过用户名查询
        userData = await usersApi.getUserProfileByUsername(username);
      } else {
        // 通过ID查询
        userData = await usersApi.getUserProfile(id!);
      }
      setUser(userData);
      

    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTabContent = async () => {
    if (!user) return;

    setContentLoading(true);
    try {
      switch (activeTab) {
        case 'records':
          // 使用 getPublicRecords API 并传入 user_id 参数获取该用户的公开记录
          const recordsRes = await recordsApi.getPublicRecords({
            page: 1,
            page_size: 10,
            user_id: user.id
          });
          setRecords(recordsRes.data);
          break;
        case 'experiences':
          // 获取所有经历然后过滤（经历API暂不支持按用户筛选）
          const expRes = await experiencesApi.getExperiences({
            page: 1,
            page_size: 100
          });
          const userExperiences = expRes.data.filter(e => e.user_id === user.id);
          setExperiences(userExperiences);
          break;
        case 'collections':
          // 获取所有收藏然后过滤（收藏API暂不支持按用户筛选）
          const colRes = await collectionsApi.getCollections({
            page: 1,
            page_size: 100
          });
          const userCollections = colRes.data.filter(c => c.user_id === user.id);
          setCollections(userCollections);
          break;
      }
    } catch (error) {
      console.error('Failed to load tab content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const handleFollowChange = (following: boolean) => {
    // 更新本地统计
    if (user) {
      setUser({
        ...user,
        followers_count: following
          ? (user.followers_count || 0) + 1
          : Math.max(0, (user.followers_count || 0) - 1)
      });
    }
  };

  const handleRecordClick = (recordId: string) => {
    navigate(`/records/${recordId}`);
  };

  const handleExperienceClick = (expId: string) => {
    navigate(`/experiences/${expId}`);
  };

  const handleCollectionClick = (collection: Collection) => {
    navigate(`/collections/${collection.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          用户不存在
        </h2>
        <p className="text-[var(--text-muted)] mb-6">
          该用户可能已被删除或不存在
        </p>
        <button 
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Header Background - 使用更柔和的渐变 */}
      <div className="h-56 bg-gradient-to-br from-[var(--accent-color)] via-[var(--accent-color)]/80 to-[var(--accent-color)]/60 relative overflow-hidden">
        {/* 添加装饰性图案 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 -mt-28">
        {/* User Card */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white dark:bg-gray-800 p-1 shadow-lg">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white text-3xl md:text-4xl font-bold">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.username} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                    {user.username}
                  </h1>
                  
                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[var(--text-muted)]">
                    {user.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {user.location}
                      </span>
                    )}
                    {user.website && (
                      <a 
                        href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-[var(--accent-color)] transition-colors"
                      >
                        <LinkIcon className="w-4 h-4" />
                        {user.website}
                      </a>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      加入于 {formatDateTime(user.created_at).split(' ')[0]}
                    </span>
                  </div>
                </div>

                {/* Follow Button */}
                {!isSelf && (
                  <FollowButton 
                    userId={user.id}
                    size="lg"
                    variant="default"
                    onFollowChange={handleFollowChange}
                  />
                )}
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-[var(--text-secondary)] mt-4">
                  {user.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-[var(--border-color)]">
                <button 
                  onClick={() => navigate(`/users/${user.id}/following`)}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <span className="text-2xl font-bold text-[var(--text-primary)]">
                    {user.following_count || 0}
                  </span>
                  <span className="text-sm text-[var(--text-muted)] ml-1">关注</span>
                </button>
                <button 
                  onClick={() => navigate(`/users/${user.id}/followers`)}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <span className="text-2xl font-bold text-[var(--text-primary)]">
                    {user.followers_count || 0}
                  </span>
                  <span className="text-sm text-[var(--text-muted)] ml-1">粉丝</span>
                </button>
                <div>
                  <span className="text-2xl font-bold text-[var(--text-primary)]">
                    {user.records_count || 0}
                  </span>
                  <span className="text-sm text-[var(--text-muted)] ml-1">记录</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[var(--text-primary)]">
                    {user.experiences_count || 0}
                  </span>
                  <span className="text-sm text-[var(--text-muted)] ml-1">经历</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[var(--text-primary)]">
                    {user.collections_count || 0}
                  </span>
                  <span className="text-sm text-[var(--text-muted)] ml-1">收藏</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[var(--border-color)]">
          {[
            { key: 'records', label: '记录', icon: FileText },
            { key: 'experiences', label: '经历', icon: Award },
            { key: 'collections', label: '收藏', icon: Bookmark },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as TabType)}
              className={`
                flex items-center gap-2 px-4 py-3 font-medium transition-colors relative
                ${activeTab === key 
                  ? 'text-[var(--accent-color)]' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
              {activeTab === key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-color)]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {contentLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
            </div>
          ) : (
            <>
              {activeTab === 'records' && (
                <div className="space-y-4">
                  {records.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-muted)]">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>还没有发布任何记录</p>
                    </div>
                  ) : (
                    records.map((record) => (
                      <div
                        key={record.id}
                        onClick={() => handleRecordClick(record.id)}
                        className="card card-hover p-5 cursor-pointer"
                      >
                        <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                          {record.title || '无标题'}
                        </h3>
                        <div className="text-[var(--text-secondary)] text-sm line-clamp-2 mb-3">
                          <HtmlContent content={record.content} />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                          <span>{formatDateTime(record.published_at || record.created_at)}</span>
                          <span>♥ {record.like_count || 0}</span>
                          <span>✉ {record.comment_count || 0}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'experiences' && (
                <div className="space-y-4">
                  {experiences.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-muted)]">
                      <Award className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>还没有添加任何经历</p>
                    </div>
                  ) : (
                    experiences.map((exp) => (
                      <div
                        key={exp.id}
                        onClick={() => handleExperienceClick(exp.id)}
                        className="card card-hover p-5 cursor-pointer"
                      >
                        <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                          {exp.title}
                        </h3>
                        <p className="text-[var(--text-secondary)] text-sm line-clamp-2 mb-2">
                          {exp.description}
                        </p>
                        <div className="text-xs text-[var(--text-muted)]">
                          {exp.start_date} {exp.end_date && `- ${exp.end_date}`}
                          {exp.is_current && ' · 至今'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'collections' && (
                <div className="space-y-4">
                  {collections.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-muted)]">
                      <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>还没有添加任何收藏</p>
                    </div>
                  ) : (
                    collections.map((collection) => (
                      <div
                        key={collection.id}
                        onClick={() => handleCollectionClick(collection)}
                        className="card card-hover p-5 cursor-pointer"
                      >
                        <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                          {collection.title}
                        </h3>
                        <p className="text-[var(--text-secondary)] text-sm line-clamp-2">
                          {collection.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
