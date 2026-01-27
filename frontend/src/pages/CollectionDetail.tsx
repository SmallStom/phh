import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { collectionsApi } from '../api/collections';
import { useAuthStore } from '../store/authStore';
import { formatDateTime } from '../utils/dateUtils';
import type { Collection } from '../types/collection';

export const CollectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [fromPlaza, setFromPlaza] = useState(false);

  useEffect(() => {
    initializeAuth();
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (authChecked && isAuthenticated && id) {
      loadCollection();
    }
  }, [authChecked, isAuthenticated, id]);

  useEffect(() => {
    const fromPlazaFlag = localStorage.getItem('fromPlaza');
    if (fromPlazaFlag === 'true') {
      setFromPlaza(true);
    }
  }, [location.key]);

  const loadCollection = async () => {
    try {
      const response = await collectionsApi.getCollection(id!);
      setCollection(response);
    } catch (error) {
      console.error('Failed to load collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('确定要删除这个收藏吗？')) return;
    
    try {
      await collectionsApi.deleteCollection(id);
      navigate('/collections');
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  const getBackText = () => {
    if (fromPlaza) return '返回广场';
    if (collection?.content_type === 'record') return '返回美好';
    if (collection?.content_type === 'experience') return '返回往日风采';
    return '返回收藏';
  };
  const handleBack = () => {
    localStorage.setItem('fromPlaza', 'false');
    if (fromPlaza) {
      navigate('/');
    } else if (collection?.content_type === 'record') {
      navigate('/records');
    } else if (collection?.content_type === 'experience') {
      navigate('/experiences');
    } else {
      navigate('/collections');
    }
  };

  const getLinkUrl = () => {
    if (!collection) return undefined;
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
      case 'record': return '记录';
      case 'experience': return '经历';
      default: return '链接';
    }
  };

  if (!authChecked || !isAuthenticated) {
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

  if (!collection) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600">收藏不存在</div>
      </div>
    );
  }

  const linkUrl = getLinkUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 mr-4"
          >
            ← {getBackText()}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">收藏详情</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center">
              <span className="text-5xl mr-4">{getIcon(collection.content_type)}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {collection.title}
                </h2>
                <span className="text-sm px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full font-medium">
                  {getTypeLabel(collection.content_type)}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {linkUrl && (
                <Link
                  to={linkUrl}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  查看原文
                </Link>
              )}
              
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg font-medium"
              >
                删除
              </button>
            </div>
          </div>

          {collection.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">描述</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {collection.description}
              </p>
            </div>
          )}

          {collection.url && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">链接</h3>
              <a
                href={collection.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:underline font-medium"
              >
                {collection.url}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2zm-6 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1h2a1 1 0 011 1v-2a1 1 0 01-1 1h-2a1 1 0 01-1 1v-2a1 1 0 011-1h2z" />
                </svg>
              </a>
            </div>
          )}

          {collection.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">标签</h3>
              <div className="flex flex-wrap gap-2">
                {collection.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <span className="mr-2">📅</span>
                创建于 {formatDateTime(collection.created_at)}
              </div>
              
              {collection.is_favorite && (
                <div className="flex items-center">
                  <span className="mr-1">⭐</span>
                  已收藏
                </div>
              )}
            </div>
            
            {collection.updated_at && (
              <div className="flex items-center text-sm text-gray-500 mt-2">
                <span className="mr-2">✏️</span>
                更新于 {formatDateTime(collection.updated_at)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
