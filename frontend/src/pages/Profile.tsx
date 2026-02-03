import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Bookmark, 
  Calendar, MapPin, Link as LinkIcon, Camera, Edit3,
  TrendingUp, Award, FileText
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../api/users';
import { AvatarUpload } from '../components/profile/AvatarUpload';
import { StatsCard } from '../components/profile/StatsCard';
import { ActivityChart } from '../components/profile/ActivityChart';
import type { UserStats, ActivityData } from '../types/auth';

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
  const [loading, setLoading] = useState(true);

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
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
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
    <div className="max-w-6xl mx-auto pb-12">
      {/* 头部背景 */}
      <div className="relative h-64 bg-gradient-to-r from-terracotta-400 via-terracotta-500 to-forest-500 rounded-2xl mb-20">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <button 
          className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Camera className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* 用户信息卡片 */}
      <div className="relative px-8 -mt-16">
        <div className="bg-white rounded-2xl shadow-lg p-6">
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
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="text-2xl font-bold text-gray-900 border-b-2 border-terracotta-500 focus:outline-none bg-transparent"
                    placeholder="用户名"
                  />
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full text-gray-600 border rounded-lg p-2 focus:ring-2 focus:ring-terracotta-500 focus:outline-none"
                    placeholder="个人简介"
                    rows={2}
                  />
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="flex-1 text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-terracotta-500 focus:outline-none"
                      placeholder="位置"
                    />
                    <input
                      type="text"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className="flex-1 text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-terracotta-500 focus:outline-none"
                      placeholder="个人网站"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition-colors"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">{user?.username}</h1>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <p className="text-gray-600 mt-1">{editForm.bio || '还没有个人简介'}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    {editForm.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {editForm.location}
                      </span>
                    )}
                    {editForm.website && (
                      <a 
                        href={editForm.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-terracotta-600 transition-colors"
                      >
                        <LinkIcon className="w-4 h-4" />
                        {editForm.website}
                      </a>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      加入于 {new Date().getFullYear()}年
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* 关注按钮 */}
            <div className="flex gap-3">
              <button className="px-6 py-2 bg-terracotta-600 text-white rounded-full hover:bg-terracotta-700 transition-colors">
                关注
              </button>
              <button className="px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                发消息
              </button>
            </div>
          </div>

          {/* 统计数字 */}
          <div className="flex gap-8 mt-6 pt-6 border-t">
            {[
              { label: '美好', value: stats.records_count },
              { label: '风采', value: stats.experiences_count },
              { label: '收藏', value: stats.collections_count },
              { label: '获赞', value: stats.likes_received },
              { label: '关注者', value: stats.followers_count },
              { label: '关注', value: stats.following_count },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="mt-8 px-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-terracotta-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="mt-8 px-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 活动图表 */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">创作活动</h3>
              <ActivityChart data={activityData} />
            </div>

            {/* 成就卡片 */}
            <div className="space-y-4">
              <StatsCard
                title="创作成就"
                icon={Award}
                stats={[
                  { label: '连续创作', value: `${stats.streak_days || 0}天`, trend: 'up' },
                  { label: '总创作', value: stats.records_count.toString(), trend: 'up' },
                ]}
              />
              <StatsCard
                title="互动数据"
                icon={Heart}
                stats={[
                  { label: '总获赞', value: stats.likes_received.toString(), trend: 'up' },
                  { label: '总评论', value: stats.comments_received.toString(), trend: 'neutral' },
                ]}
              />
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">我的美好记录</h3>
            <p className="text-gray-500 mb-4">共 {stats.records_count} 条记录</p>
            <button 
              onClick={() => navigate('/records')}
              className="px-6 py-2 bg-terracotta-600 text-white rounded-full hover:bg-terracotta-700 transition-colors"
            >
              查看全部
            </button>
          </div>
        )}

        {activeTab === 'experiences' && (
          <div className="text-center py-16">
            <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">我的风采</h3>
            <p className="text-gray-500 mb-4">共 {stats.experiences_count} 个风采</p>
            <button 
              onClick={() => navigate('/experiences')}
              className="px-6 py-2 bg-terracotta-600 text-white rounded-full hover:bg-terracotta-700 transition-colors"
            >
              查看全部
            </button>
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="text-center py-16">
            <Bookmark className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">我的收藏</h3>
            <p className="text-gray-500 mb-4">共 {stats.collections_count} 个收藏</p>
            <button 
              onClick={() => navigate('/collections')}
              className="px-6 py-2 bg-terracotta-600 text-white rounded-full hover:bg-terracotta-700 transition-colors"
            >
              查看全部
            </button>
          </div>
        )}

        {activeTab === 'likes' && (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">喜欢的内容</h3>
            <p className="text-gray-500">这里会显示你喜欢的所有内容</p>
          </div>
        )}
      </div>
    </div>
  );
};
