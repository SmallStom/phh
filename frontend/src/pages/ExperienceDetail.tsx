import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { experiencesApi } from '../api/experiences';
import { collectionsApi } from '../api/collections';
import { useAuthStore } from '../store/authStore';
import { formatDateTime, formatDate } from '../utils/dateUtils';
import { useSEO } from '../hooks/useSEO';
import type { Experience } from '../types/experience';

const categoryIcons: Record<string, { icon: string; label: string; color: string }> = {
  work: { icon: '💼', label: '工作', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  project: { icon: '🚀', label: '项目', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  education: { icon: '🎓', label: '教育', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  milestone: { icon: '🏆', label: '里程碑', color: 'bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/30 dark:text-terracotta-300' },
  other: { icon: '📌', label: '其他', color: 'bg-sand-200 text-sand-800 dark:bg-sand-800 dark:text-sand-200' },
};

export const ExperienceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [fromSource, setFromSource] = useState<string | null>(null);
  const [isCollected, setIsCollected] = useState(false);

  // SEO: 动态设置页面 meta 标签
  useSEO({
    title: experience ? `${experience.title} - 美好广场` : '美好广场 - 发现和分享美好的瞬间',
    description: experience ? (experience.description?.replace(/<[^>]*>/g, '').slice(0, 160) || '在美好广场查看这段经历') : '记录生活、展示经历、收藏兴趣，打造属于你的个人空间。',
    keywords: experience ? ['美好广场', '经历', experience.category as string || ''].join(',') : '美好广场,个人记录,生活分享',
    type: 'article',
    author: experience?.user?.username,
  });

  useEffect(() => {
    initializeAuth();
    setAuthChecked(true);
  }, []);

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (id) {
      loadExperience();
    }
  }, [id]);

  useEffect(() => {
    const source = localStorage.getItem('fromSource');
    setFromSource(source);
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

  const getBackButtonText = () => {
    if (fromSource === 'plaza') return '返回广场';
    if (fromSource === 'collections') return '返回收藏';
    return '返回往日风采';
  };

  const handleBack = () => {
    localStorage.removeItem('fromSource');
    if (fromSource === 'plaza') {
      navigate('/');
    } else if (fromSource === 'collections') {
      navigate('/collections');
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

  const getCategoryInfo = (category?: string) => {
    return categoryIcons[category || 'other'] || categoryIcons.other;
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-pulse text-[var(--text-secondary)]">加载中...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-terracotta-500 border-t-transparent" />
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-[var(--text-secondary)]">经历不存在</div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(experience.category);

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] 
                         transition-colors rounded-xl hover:bg-[var(--bg-secondary)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">{getBackButtonText()}</span>
            </button>
            
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCollect}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    isCollected 
                      ? 'bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/30 dark:text-terracotta-300' 
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-terracotta-50 hover:text-terracotta-600'
                  }`}
                >
                  <span className="text-lg">{isCollected ? '★' : '☆'}</span>
                  <span>{isCollected ? '已收藏' : '收藏'}</span>
                </button>
                
                <button
                  onClick={() => navigate(`/experiences/${id}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium
                           bg-[var(--bg-secondary)] text-[var(--text-secondary)] 
                           hover:bg-forest-50 hover:text-forest-600 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>编辑</span>
                </button>
                
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium
                           bg-red-50 text-red-600 hover:bg-red-100 
                           transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>删除</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <article className="bg-[var(--card-bg)] rounded-2xl shadow-card p-6 md:p-8 animate-fade-in">
          {/* 头部信息 */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              {/* 分类标签 */}
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${categoryInfo.color}`}>
                  <span className="text-lg">{categoryInfo.icon}</span>
                  <span>{categoryInfo.label}</span>
                </span>
              </div>
              
              {/* 标题 */}
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] heading-display leading-tight">
                {experience.title}
              </h1>
            </div>
            
            {/* 时间信息 */}
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] bg-[var(--bg-secondary)] px-4 py-2 rounded-xl">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {formatDate(experience.start_date)}
                {experience.end_date && ` - ${formatDate(experience.end_date)}`}
                {experience.is_current && <span className="ml-2 text-forest-600 dark:text-forest-400 font-medium">至今</span>}
              </span>
            </div>
          </div>
          
          {/* 分隔线 */}
          <div className="border-t border-[var(--border-color)] my-6" />
          
          {/* 描述 */}
          {experience.description && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                描述
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {experience.description}
                </p>
              </div>
            </div>
          )}
          
          {/* 标签 */}
          {experience.tags && experience.tags.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                标签
              </h2>
              <div className="flex flex-wrap gap-2">
                {experience.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1.5 bg-terracotta-50 text-terracotta-600 
                                           dark:bg-terracotta-900/20 dark:text-terracotta-300
                                           rounded-full text-sm font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* 底部信息 */}
          <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                创建于 {formatDateTime(experience.created_at)}
              </span>
              {experience.updated_at && experience.updated_at !== experience.created_at && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    更新于 {formatDateTime(experience.updated_at)}
                  </span>
                </>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
