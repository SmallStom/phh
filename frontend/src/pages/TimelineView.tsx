import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { experiencesApi } from '../api/experiences';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/dateUtils';
import type { Experience } from '../types/experience';

export const TimelineView: React.FC = () => {
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    initializeAuth();
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadExperiences();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('fromSearch', 'false');
  }, []);

  const loadExperiences = async () => {
    try {
      setLoading(true);
      const response = await experiencesApi.getExperiences();
      setExperiences(response.data);
    } catch (error) {
      console.error('Failed to load experiences:', error);
    } finally {
      setLoading(false);
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

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-gray-600 text-lg mb-6">请先登录以访问往日风采</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">往日风采</h1>
            <p className="text-gray-600">记录你的成长轨迹和重要时刻</p>
          </div>
          <Link
            to="/experiences/new"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            + 添加往日风采
          </Link>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : experiences.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-500 text-lg">还没有经历，开始记录你的故事吧！</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-full"></div>
            
            <div className="space-y-8 pl-16">
              {experiences.map((exp, index) => (
                <div key={exp.id} className="relative">
                  <div className="absolute left-0 w-16 h-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg border-4 border-white flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all border border-gray-100 ml-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                          <span className="mr-3">{getCategoryIcon(exp.category)}</span>
                          {exp.title}
                        </h2>
                        {exp.category && (
                          <span className="inline-block px-4 py-1.5 text-sm rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 font-medium mb-2">
                            {getCategoryLabel(exp.category)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 flex items-center bg-gray-50 px-3 py-1.5 rounded-full">
                        <span className="mr-1">📅</span>
                        {formatDate(exp.start_date)}
                        {exp.end_date && ` - ${formatDate(exp.end_date)}`}
                        {exp.is_current && <span className="ml-2 text-green-600 font-medium">至今</span>}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        to={`/experiences/${exp.id}/edit`}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg font-medium"
                      >
                        编辑
                      </Link>
                      <Link
                        to={`/experiences/${exp.id}`}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all shadow-md hover:shadow-lg font-medium"
                      >
                        详情
                      </Link>
                    </div>
                    
                    {exp.description && (
                      <p className="text-gray-600 mb-4 leading-relaxed text-lg">
                        {exp.description}
                      </p>
                    )}
                    
                    {exp.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {exp.tags.map((tag) => (
                          <span key={tag} className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
