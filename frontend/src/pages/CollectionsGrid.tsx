import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionsApi } from '../api/collections';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/dateUtils';
import type { Collection } from '../types/collection';

const typeIcons: Record<string, { icon: string; label: string; color: string }> = {
  article: { icon: '📄', label: '文章', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  video: { icon: '🎬', label: '视频', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  book: { icon: '📚', label: '书籍', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  tool: { icon: '🔧', label: '工具', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  resource: { icon: '📦', label: '资源', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  record: { icon: '✦', label: '今日美好', color: 'bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-300' },
  experience: { icon: '◆', label: '往日风采', color: 'bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/30 dark:text-terracotta-300' },
  link: { icon: '🔗', label: '链接', color: 'bg-sand-200 text-sand-800 dark:bg-sand-800 dark:text-sand-200' },
};

export const CollectionsGrid: React.FC = () => {
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'favorite'>('all');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    initializeAuth();
    setAuthChecked(true);
  }, []);

  // 恢复滚动位置 - 在数据加载完成后执行
  useEffect(() => {
    if (!loading && collections.length > 0) {
      const savedScrollY = localStorage.getItem('collectionsScrollY');
      if (savedScrollY) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedScrollY));
          localStorage.removeItem('collectionsScrollY');
        });
      }
    }
  }, [loading, collections]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCollections();
    }
  }, [filter, isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('fromSearch', 'false');
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const response = await collectionsApi.getCollections({
        is_favorite: filter === 'favorite' ? true : undefined,
      });
      setCollections(response.data);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await collectionsApi.toggleFavorite(id);
      loadCollections();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个收藏吗？')) return;
    
    try {
      await collectionsApi.deleteCollection(id);
      loadCollections();
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  const getLinkUrl = (collection: Collection) => {
    if (collection.content_type === 'record' && collection.content_id) {
      return `/records/${collection.content_id}`;
    } else if (collection.content_type === 'experience' && collection.content_id) {
      return `/experiences/${collection.content_id}`;
    }
    return undefined;
  };

  const getTypeInfo = (type?: string) => {
    return typeIcons[type || 'link'] || typeIcons.link;
  };

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-terracotta-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">请先登录</h2>
          <p className="text-[var(--text-secondary)] mb-6">登录后即可管理您的收藏</p>
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 bg-terracotta-500 text-white rounded-xl font-medium
                     hover:bg-terracotta-600 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2 heading-display">
            我的收藏
          </h1>
          <p className="text-[var(--text-secondary)]">收集和管理你的资源、文章和美好回忆</p>
          <div className="decorative-line mt-4" />
        </div>

        {/* 筛选和添加按钮 */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                filter === 'all' 
                  ? 'bg-terracotta-500 text-white shadow-md' 
                  : 'bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('favorite')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-1.5 ${
                filter === 'favorite' 
                  ? 'bg-terracotta-500 text-white shadow-md' 
                  : 'bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              收藏
            </button>
          </div>
          
          <Link
            to="/collections/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-500 text-white rounded-xl font-medium
                     hover:bg-forest-600 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加收藏
          </Link>
        </div>
        
        {/* 收藏列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-terracotta-500 border-t-transparent" />
          </div>
        ) : collections.length === 0 ? (
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sand-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">还没有收藏</h3>
            <p className="text-[var(--text-secondary)]">开始添加您的第一个收藏吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map((collection, index) => {
              const linkUrl = getLinkUrl(collection);
              const typeInfo = getTypeInfo(collection.content_type);
              
              return (
                <div
                  key={collection.id}
                  className="bg-[var(--card-bg)] rounded-xl shadow-card p-5 
                           hover:shadow-card-hover transition-all duration-300 group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* 头部 */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${typeInfo.color}`}>
                      <span>{typeInfo.icon}</span>
                      <span>{typeInfo.label}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleFavorite(collection.id)}
                        className={`p-1.5 rounded-lg transition-all duration-300 hover:scale-110 ${
                          collection.is_favorite 
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' 
                            : 'text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-50'
                        }`}
                        title={collection.is_favorite ? '取消收藏' : '加入收藏'}
                      >
                        <svg className="w-5 h-5" fill={collection.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(collection.id)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 
                                 hover:bg-red-50 transition-all duration-300"
                        title="删除收藏"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* 标题 */}
                  {linkUrl ? (
                    <Link 
                      to={linkUrl} 
                      className="block mb-3"
                      onClick={() => {
                        localStorage.setItem('fromSource', 'collections');
                        localStorage.setItem('collectionsScrollY', window.scrollY.toString());
                      }}
                    >
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-terracotta-600 
                                   transition-colors line-clamp-2">
                        {collection.title}
                      </h3>
                    </Link>
                  ) : (
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 line-clamp-2">
                      {collection.title}
                    </h3>
                  )}
                  
                  {/* 描述 */}
                  {collection.description && (
                    <p className="text-[var(--text-secondary)] text-sm mb-4 line-clamp-2 leading-relaxed">
                      {collection.description}
                    </p>
                  )}
                  
                  {/* 链接 */}
                  {collection.url && (
                    <a
                      href={collection.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-terracotta-600 
                               hover:text-terracotta-700 font-medium mb-4 group/link"
                    >
                      <span>访问链接</span>
                      <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5 
                                    group-hover/link:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  
                  {/* 底部信息 */}
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(collection.created_at)}
                    </span>
                  </div>
                  
                  {/* 标签 */}
                  {collection.tags && collection.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {collection.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-terracotta-50 text-terracotta-600 
                                                 dark:bg-terracotta-900/20 dark:text-terracotta-300
                                                 rounded-full text-xs font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
