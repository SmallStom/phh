import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { experiencesApi } from '../api/experiences';
import { collectionsApi } from '../api/collections';
import { useAuthStore } from '../store/authStore';
import { formatDateTime, formatDate } from '../utils/dateUtils';
import type { Experience } from '../types/experience';

export const ExperienceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [fromPlaza, setFromPlaza] = useState(false);
  const [isCollected, setIsCollected] = useState(false);

  useEffect(() => {
    initializeAuth();
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (id) {
      loadExperience();
    }
  }, [id]);

  useEffect(() => {
    const fromPlazaFlag = localStorage.getItem('fromPlaza');
    setFromPlaza(fromPlazaFlag === 'true');
  }, [location.key]);

  const loadExperience = async () => {
    try {
      setLoading(true);
      const response = await experiencesApi.getExperience(id!);
      setExperience(response);

      if (isAuthenticated) {
        try {
          const checkResult = await collectionsApi.checkCollected('experience', id!);
          setIsCollected(checkResult.is_collected);
        } catch {
          setIsCollected(false);
        }
      }
    } catch (error) {
      console.error('Failed to load experience:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个经历吗？')) {
      return;
    }
    
    try {
      await experiencesApi.deleteExperience(id!);
      navigate('/experiences');
    } catch (error) {
      console.error('Failed to delete experience:', error);
    }
  };

  const handleBack = () => {
    if (fromPlaza) {
      navigate('/');
    } else {
      navigate('/experiences');
    }
  };

  const handleCollect = async () => {
    if (!experience) return;

    try {
      if (isCollected) {
        await collectionsApi.uncollectContent('experience', experience.id);
        setIsCollected(false);
        alert('已取消收藏');
      } else {
        await collectionsApi.collectContent('experience', experience.id);
        setIsCollected(true);
        alert('收藏成功！');
      }
    } catch (error) {
      console.error('Failed to collect/uncollect experience:', error);
      alert('操作失败，请重试');
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'work': return '💼';
      case 'project': return '🚀';
      case 'education': return '🎓';
      case 'milestone': return '🏆';
      default: return '📌';
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'work': return '工作';
      case 'project': return '项目';
      case 'education': return '教育';
      case 'milestone': return '里程碑';
      default: return '其他';
    }
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600">经历不存在</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900"
          >
            {fromPlaza ? '← 返回广场' : '← 返回往日风采'}
          </button>
          {isAuthenticated && (
            <div className="flex space-x-4">
              <button
                onClick={handleCollect}
                className={`px-6 py-2.5 text-white rounded-xl transition-all shadow-md hover:shadow-lg font-medium ${
                  isCollected ? 'bg-gray-500 hover:bg-gray-600' : 'bg-yellow-500 hover:bg-yellow-600'
                }`}
              >
                {isCollected ? '已收藏' : '收藏'}
              </button>
              <button
                onClick={() => navigate(`/experiences/${id}/edit`)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                编辑
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                删除
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-4 text-5xl">{getCategoryIcon(experience.category)}</span>
                {experience.title}
              </h1>
              {experience.category && (
                <span className="inline-block px-6 py-2 text-lg rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 font-semibold mb-4">
                  {getCategoryLabel(experience.category)}
                </span>
              )}
            </div>
            <span className="text-lg text-gray-500 flex items-center bg-gray-50 px-6 py-2 rounded-full">
              <span className="mr-2 text-xl">📅</span>
              {formatDate(experience.start_date)}
              {experience.end_date && ` - ${formatDate(experience.end_date)}`}
              {experience.is_current && <span className="ml-3 text-green-600 font-semibold">至今</span>}
            </span>
          </div>
          
          {experience.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">描述</h2>
              <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                {experience.description}
              </p>
            </div>
          )}
          
          {experience.tags && experience.tags.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {experience.tags.map((tag) => (
                <span key={tag} className="px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-base font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-sm text-gray-500">
            <p>创建于: {formatDateTime(experience.created_at)}</p>
            {experience.updated_at && (
              <p>更新于: {formatDateTime(experience.updated_at)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};