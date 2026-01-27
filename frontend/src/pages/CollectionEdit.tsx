import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collectionsApi } from '../api/collections';
import { recordsApi } from '../api/records';
import { experiencesApi } from '../api/experiences';
import { useAuthStore } from '../store/authStore';
import type { CollectionCreate, CollectionType } from '../types/collection';

export const CollectionEdit: React.FC = () => {
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const navigate = useNavigate();
  const { recordId, experienceId } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [contentType, setContentType] = useState<CollectionType>('resource');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [sourceData, setSourceData] = useState<any>(null);

  useEffect(() => {
    initializeAuth();
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (authChecked && isAuthenticated) {
      loadSourceData();
    }
  }, [authChecked, isAuthenticated, recordId, experienceId]);

  const loadSourceData = async () => {
    if (recordId) {
      try {
        const record = await recordsApi.getRecord(recordId);
        setSourceData(record);
        setTitle(record.title || '收藏记录');
        setDescription(record.content);
        setContentType('record');
      } catch (error) {
        console.error('Failed to load record:', error);
      }
    } else if (experienceId) {
      try {
        const experience = await experiencesApi.getExperience(experienceId);
        setSourceData(experience);
        setTitle(experience.title);
        setDescription(experience.description || '');
        setContentType('experience');
      } catch (error) {
        console.error('Failed to load experience:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      console.log('Creating collection with content_type:', contentType);
      const data: CollectionCreate = {
        title,
        description,
        url: url || undefined,
        content_type: contentType,
        content_id: sourceData?.id,
        tags: tags ? tags.split(/[,，;；]/).map(t => t.trim()).filter(t => t) : [],
        is_favorite: false,
        is_public: false,
      };
      
      await collectionsApi.createCollection(data);
      navigate('/collections');
    } catch (error) {
      console.error('Failed to create collection:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  const getTypeLabel = (type: CollectionType) => {
    switch (type) {
      case 'article': return '文章';
      case 'video': return '视频';
      case 'book': return '书籍';
      case 'tool': return '工具';
      case 'resource': return '资源';
      case 'record': return '今日美好';
      case 'experience': return '往日风采';
      default: return '资源';
    }
  };

  const isInternalContent = contentType === 'record' || contentType === 'experience';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/collections')}
          className="text-gray-600 hover:text-gray-900"
        >
          ← 返回收藏
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {recordId ? '收藏今日美好' : experienceId ? '收藏往日风采' : '添加收藏'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入标题..."
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            类型
          </label>
          <div className="flex flex-wrap gap-2">
            {(['article', 'video', 'book', 'tool', 'resource', 'record', 'experience'] as CollectionType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setContentType(type)}
                disabled={!!recordId || !!experienceId}
                className={`px-4 py-2 rounded-md transition-colors ${
                  contentType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${recordId || experienceId ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {getTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {!isInternalContent && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              链接（可选）
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            描述（可选）
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="添加描述或备注..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            标签（可选，用逗号分隔）
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="标签1, 标签2, 标签3"
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/collections')}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
};
