import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Bookmark, 
  Calendar, MapPin, Link as LinkIcon, Edit3,
  TrendingUp, FileText, MessageCircle, Users, UserPlus
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../api/users';
import { recordsApi } from '../api/records';
import { experiencesApi } from '../api/experiences';
import { collectionsApi } from '../api/collections';
import { likesApi } from '../api/likes';
import { AvatarUpload } from '../components/profile/AvatarUpload';
import { StatsCard } from '../components/profile/StatsCard';
import { ActivityChart } from '../components/profile/ActivityChart';
import { HtmlContent } from '../components/HtmlContent';
import type { UserStats, ActivityData } from '../types/auth';
import type { Record } from '../types/record';
import type { Experience } from '../types/experience';
import type { Collection } from '../types/collection';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'experiences' | 'collections' | 'likes'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    records_count: 0,
    experiences_count: 0,
    collections_count: 0,
    likes_received: 0,
    comments_received: 0,
    followers_count: 0,
    following_count: 0,
  });
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [likedRecords, setLikedRecords] = useState<Record[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadUserData();
  }, [isAuthenticated]);

  // 当标签页切换时加载对应数据
  useEffect(() => {
    if (!isAuthenticated) return;
    
    switch (activeTab) {
      case 'records':
        loadRecords();
        break;
      case 'experiences':
        loadExperiences();
        break;
      case 'collections':
        loadCollections();
        break;
      case 'likes':
        loadLikedRecords();
        break;
    }
  }, [activeTab]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // 使用新的API获取用户完整资料
      const [profileRes, activityRes] = await Promise.all([
        usersApi.getMyProfile(),
        usersApi.getMyActivity(30),
      ]);

      // 更新用户信息和统计
      setUser(profileRes);
      setStats({
        records_count: profileRes.records_count || 0,
        experiences_count: profileRes.experiences_count || 0,
        collections_count: profileRes.collections_count || 0,
        likes_received: profileRes.likes_received || 0,
        comments_received: profileRes.comments_received || 0,
        followers_count: profileRes.followers_count || 0,
        following_count: profileRes.following_count || 0,
      });

      // 设置活动数据
      setActivityData(activityRes.data);
      
      // 更新编辑表单
      setEditForm({
        username: profileRes.username || '',
        bio: profileRes.bio || '',
        location: profileRes.location || '',
        website: profileRes.website || '',
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const updatedUser = await usersApi.updateProfile({
        username: editForm.username,
        bio: editForm.bio,
        location: editForm.location,
        website: editForm.website,
      });
      setUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const updatedUser = await usersApi.uploadAvatar(file);
      
      // 更新全局状态（会同时更新 localStorage）
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  };

  const loadRecords = async () => {
    try {
      setTabLoading(true);
      const response = await recordsApi.getRecords({ page: 1, page_size: 20 });
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setTabLoading(false);
    }
  };

  const loadExperiences = async () => {
    try {
      setTabLoading(true);
      const response = await experiencesApi.getExperiences({ page: 1, page_size: 20 });
      setExperiences(response.data);
    } catch (error) {
      console.error('Failed to load experiences:', error);
    } finally {
      setTabLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      setTabLoading(true);
      const response = await collectionsApi.getCollections({ page: 1, page_size: 20 });
      setCollections(response.data);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setTabLoading(false);
    }
  };

  const loadLikedRecords = async () => {
    try {
      setTabLoading(true);
      const response = await likesApi.getMyLikes(1, 20);
      setLikedRecords(response.data.map(item => item.record));
      setLikesCount(response.total);
    } catch (error) {
      console.error('Failed to load liked records:', error);
    } finally {
      setTabLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: '概览', icon: FileText },
    { id: 'records', label: '美好', icon: FileText },
    { id: 'experiences', label: '风采', icon: TrendingUp },
    { id: 'collections', label: '收藏', icon: Bookmark },
    { id: 'likes', label: '喜欢', icon: Heart },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 pt-8">
      {/* 用户信息卡片 */}
      <div className="relative px-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* 头像 */}
            <div className="relative -mt-20">
              <AvatarUpload
                currentAvatar={user?.avatar}
                username={user?.username}
                size="xl"
                onUpload={handleAvatarUpload}
              />
            </div>

            {/* 用户信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="text-2xl font-bold bg-transparent border-b-2 border-terracotta-500 focus:outline-none focus:border-terracotta-600"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user?.username}
                  </h1>
                )}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* 个人简介 */}
              {isEditing ? (
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="添加个人简介..."
                  className="w-full mt-2 p-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  rows={3}
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {user?.bio || '还没有个人简介'}
                </p>
              )}

              {/* 位置、网站、加入时间 */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="添加位置"
                      className="bg-transparent border-b border-gray-300 focus:outline-none focus:border-terracotta-500"
                    />
                  </div>
                ) : user?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location}</span>
                  </div>
                )}

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    <input
                      type="text"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="添加网站"
                      className="bg-transparent border-b border-gray-300 focus:outline-none focus:border-terracotta-500"
                    />
                  </div>
                ) : user?.website && (
                  <a
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-terracotta-600 transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>{user.website}</span>
                  </a>
                )}

                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>加入于 {user?.created_at ? new Date(user.created_at).getFullYear() : '2024'}年</span>
                </div>
              </div>

              {/* 保存/取消按钮 */}
              {isEditing && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        username: user?.username || '',
                        bio: user?.bio || '',
                        location: user?.location || '',
                        website: user?.website || '',
                      });
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-4">
              <StatsCard
                icon={Users}
                label="粉丝"
                value={stats.followers_count}
                onClick={() => navigate('followers')}
              />
              <StatsCard
                icon={UserPlus}
                label="关注"
                value={stats.following_count}
                onClick={() => navigate('following')}
              />
              <StatsCard
                icon={Heart}
                label="获赞"
                value={stats.likes_received}
              />
              <StatsCard
                icon={MessageCircle}
                label="评论"
                value={stats.comments_received}
              />
              <StatsCard
                icon={FileText}
                label="美好"
                value={stats.records_count}
                onClick={() => setActiveTab('records')}
              />
              <StatsCard
                icon={TrendingUp}
                label="风采"
                value={stats.experiences_count}
                onClick={() => setActiveTab('experiences')}
              />
              <StatsCard
                icon={Bookmark}
                label="收藏"
                value={stats.collections_count}
                onClick={() => setActiveTab('collections')}
              />
              <StatsCard
                icon={Heart}
                label="喜欢"
                value={likesCount}
                onClick={() => setActiveTab('likes')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="mt-8 px-8">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-terracotta-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 内容区域 */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 活动图表 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  最近活动
                </h3>
                <ActivityChart data={activityData} />
              </div>


            </div>
          )}

          {activeTab === 'records' && (
            <div className="space-y-4">
              {tabLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-600"></div>
                </div>
              ) : records.length > 0 ? (
                <div className="space-y-4">
                  {records.map((record) => (
                    <div 
                      key={record.id} 
                      onClick={() => navigate(`/records/${record.id}`)}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{record.title || '无标题'}</h3>
                      <div className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                        <HtmlContent content={record.content} />
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                        <span>{new Date(record.created_at).toLocaleDateString()}</span>
                        {record.record_type && <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{record.record_type}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>还没有美好记录</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'experiences' && (
            <div className="space-y-4">
              {tabLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-600"></div>
                </div>
              ) : experiences.length > 0 ? (
                <div className="space-y-4">
                  {experiences.map((experience) => (
                    <div 
                      key={experience.id} 
                      onClick={() => navigate(`/experiences/${experience.id}`)}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{experience.title || '无标题'}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{experience.description}</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                        <span>{new Date(experience.created_at).toLocaleDateString()}</span>
                        {experience.category && <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{experience.category}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>还没有风采展示</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'collections' && (
            <div className="space-y-4">
              {tabLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-600"></div>
                </div>
              ) : collections.length > 0 ? (
                <div className="space-y-4">
                  {collections.map((collection) => (
                    <div 
                      key={collection.id} 
                      onClick={() => navigate(`/collections/${collection.id}`)}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{collection.title || '无标题'}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{collection.description}</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                        <span>{new Date(collection.created_at).toLocaleDateString()}</span>
                        {collection.content_type && <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{collection.content_type}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>还没有收藏内容</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'likes' && (
            <div className="space-y-4">
              {tabLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-600"></div>
                </div>
              ) : likedRecords.length > 0 ? (
                <div className="space-y-4">
                  {likedRecords.map((record) => (
                    <div
                      key={record.id}
                      onClick={() => navigate(`/records/${record.id}`)}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{record.title || '无标题'}</h3>
                      <div className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                        <HtmlContent content={record.content} />
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                        <span>{new Date(record.created_at).toLocaleDateString()}</span>
                        {record.record_type && <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{record.record_type}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>还没有喜欢的内容</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
