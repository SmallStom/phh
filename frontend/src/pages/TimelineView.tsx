import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { experiencesApi } from '../api/experiences';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/dateUtils';
import type { Experience } from '../types/experience';

const categoryIcons: Record<string, { icon: string; label: string; color: string; dotColor: string }> = {
  work: { 
    icon: '💼', 
    label: '工作', 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    dotColor: 'bg-blue-500'
  },
  project: { 
    icon: '🚀', 
    label: '项目', 
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    dotColor: 'bg-purple-500'
  },
  education: { 
    icon: '🎓', 
    label: '教育', 
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    dotColor: 'bg-amber-500'
  },
  milestone: { 
    icon: '🏆', 
    label: '里程碑', 
    color: 'bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/30 dark:text-terracotta-300',
    dotColor: 'bg-terracotta-500'
  },
  other: { 
    icon: '📌', 
    label: '其他', 
    color: 'bg-sand-200 text-sand-800 dark:bg-sand-800 dark:text-sand-200',
    dotColor: 'bg-sand-500'
  },
};

export const TimelineView: React.FC = () => {
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    initializeAuth();
    setAuthChecked(true);
  }, []);

  // 恢复滚动位置 - 在数据加载完成后执行
  useEffect(() => {
    if (!loading && experiences.length > 0) {
      const savedScrollY = localStorage.getItem('experiencesScrollY');
      if (savedScrollY) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedScrollY));
          localStorage.removeItem('experiencesScrollY');
        });
      }
    }
  }, [loading, experiences]);

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

  const getCategoryInfo = (category?: string) => {
    return categoryIcons[category || 'other'] || categoryIcons.other;
  };

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center bg-[var(--card-bg)] rounded-2xl shadow-card p-12 max-w-md mx-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-terracotta-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-[var(--text-secondary)] text-lg mb-6">请先登录以访问往日风采</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition-all shadow-md hover:shadow-lg font-medium"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2 heading-display">
                往日风采
              </h1>
              <p className="text-[var(--text-secondary)]">记录你的成长轨迹和重要时刻</p>
            </div>
            <Link
              to="/experiences/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-500 text-white rounded-xl font-medium
                       hover:bg-forest-600 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加经历
            </Link>
          </div>
          <div className="decorative-line mt-4" />
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-terracotta-500 border-t-transparent" />
          </div>
        ) : experiences.length === 0 ? (
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sand-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">还没有经历</h3>
            <p className="text-[var(--text-secondary)]">开始记录你的故事吧！</p>
          </div>
        ) : (
          <div className="relative">
            {/* 时间线 */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-terracotta-400 via-forest-400 to-sand-400 rounded-full"></div>
            
            <div className="space-y-6 pl-14">
              {experiences.map((exp, index) => {
                const categoryInfo = getCategoryInfo(exp.category);
                
                return (
                  <div key={exp.id} className="relative animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    {/* 时间点 */}
                    <div className={`absolute left-0 w-12 h-full flex items-center justify-center`}>
                      <div className={`w-4 h-4 ${categoryInfo.dotColor} rounded-full shadow-lg ring-4 ring-[var(--bg-primary)]`} />
                    </div>
                    
                    {/* 卡片内容 */}
                    <div className="bg-[var(--card-bg)] rounded-2xl shadow-card p-6 hover:shadow-card-hover transition-all duration-300 group">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${categoryInfo.color}`}>
                              <span>{categoryInfo.icon}</span>
                              <span>{categoryInfo.label}</span>
                            </span>
                          </div>
                          <h2 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-terracotta-600 transition-colors">
                            {exp.title}
                          </h2>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded-xl shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {formatDate(exp.start_date)}
                            {exp.end_date && ` - ${formatDate(exp.end_date)}`}
                            {exp.is_current && <span className="ml-2 text-forest-600 dark:text-forest-400 font-medium">至今</span>}
                          </span>
                        </div>
                      </div>
                      
                      {exp.description && (
                        <p className="text-[var(--text-secondary)] mb-4 leading-relaxed line-clamp-2">
                          {exp.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {exp.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {exp.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-terracotta-50 text-terracotta-600 
                                               dark:bg-terracotta-900/20 dark:text-terracotta-300
                                               rounded-full text-xs font-medium">
                                #{tag}
                              </span>
                            ))}
                            {exp.tags.length > 3 && (
                              <span className="px-2 py-1 text-xs text-[var(--text-muted)]">
                                +{exp.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 ml-auto">
                          <Link
                            to={`/experiences/${exp.id}/edit`}
                            onClick={() => localStorage.setItem('experiencesScrollY', window.scrollY.toString())}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--bg-secondary)] text-[var(--text-secondary)] 
                                     rounded-lg hover:bg-forest-50 hover:text-forest-600 transition-all duration-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            编辑
                          </Link>
                          <Link
                            to={`/experiences/${exp.id}`}
                            onClick={() => localStorage.setItem('experiencesScrollY', window.scrollY.toString())}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-terracotta-500 text-white 
                                     rounded-lg hover:bg-terracotta-600 transition-all duration-300 shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            详情
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
