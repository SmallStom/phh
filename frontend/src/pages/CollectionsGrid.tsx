import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionsApi } from '../api/collections';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/dateUtils';
import type { Collection } from '../types/collection';

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

  const getIcon = (type?: string) => {
    switch (type) {
      case 'article': return '📄';
      case 'video': return '🎬';
      case 'book': return '📚';
      case 'tool': return '🔧';
      case 'resource': return '📦';
      case 'record': return '📝';
      case 'experience': return '🎯';
      default: return '🔗';
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'article': return '文章';
      case 'video': return '视频';
      case 'book': return '书籍';
      case 'tool': return '工具';
      case 'resource': return '资源';
      case 'record': return '今日美好';
      case 'experience': return '往日风采';
      default: return '链接';
    }
  };

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-gray-600 text-lg mb-6">请先登录以访问收藏</p>
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">收藏</h1>
            <p className="text-gray-600">收集和管理你的资源、文章和工具</p>
          </div>
          <Link
            to="/collections/new"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            + 添加收藏
          </Link>
        </div>
        
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2.5 rounded-xl transition-all font-medium shadow-md border-2 ${
              filter === 'all' 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('favorite')}
            className={`px-6 py-2.5 rounded-xl transition-all font-medium shadow-md border-2 ${
              filter === 'favorite' 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
            }`}
          >
            ⭐ 收藏
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : collections.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg">还没有收藏，开始添加你的第一个收藏吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => {
              const linkUrl = getLinkUrl(collection);
              return (
                <div
                  key={collection.id}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-4xl">{getIcon(collection.content_type)}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleFavorite(collection.id)}
                        className="text-3xl hover:scale-110 transition-transform"
                      >
                        {collection.is_favorite ? '⭐' : '☆'}
                      </button>
                      <button
                        onClick={() => handleDelete(collection.id)}
                        className="text-xl hover:scale-110 transition-transform text-gray-400 hover:text-red-500"
                        title="删除收藏"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {linkUrl ? (
                    <Link
                      to={linkUrl}
                      className="block"
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {collection.title}
                      </h3>
                    </Link>
                  ) : (
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {collection.title}
                    </h3>
                  )}
                  
                  {collection.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {collection.description}
                    </p>
                  )}
                  
                  {collection.url && (
                    <a
                      href={collection.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 text-sm font-medium hover:underline mb-4"
                    >
                      访问链接
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2zm-6 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1h2a1 1 0 011 1v-2a1 1 0 01-1 1h-2a1 1 0 01-1 1v-2a1 1 0 011-1h2z" />
                      </svg>
                    </a>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500 flex items-center bg-gray-50 px-3 py-1.5 rounded-full">
                      <span className="mr-1">📅</span>
                      {formatDate(collection.created_at)}
                    </span>
                    
                    {collection.content_type && (
                      <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full font-medium">
                        {getTypeLabel(collection.content_type)}
                      </span>
                    )}
                  </div>
                  
                  {collection.tags && collection.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {collection.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
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
