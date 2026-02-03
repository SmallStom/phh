import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recordsApi } from '../api/records';
import { useAuthStore } from '../store/authStore';
import type { RecordCreate } from '../types/record';
import { TagInput } from '../components/TagInput';
import { RichTextEditor } from '../components/RichTextEditor';
import { useRecordDraft } from '../hooks/useDraftSave';

export const RecordEdit: React.FC = () => {
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const draft = useRecordDraft();
  
  // 从 draft 初始化状态（只执行一次）
  const [recordType, setRecordType] = useState<'note' | 'idea' | 'log'>(
    draft.data.recordType || 'note'
  );
  const [title, setTitle] = useState(draft.data.title || '');
  const [content, setContent] = useState(draft.data.content || '');
  const [tags, setTags] = useState<string[]>(draft.data.tags || []);

  useEffect(() => {
    initializeAuth();
    setAuthChecked(true);
  }, []);

  // 自动保存草稿 - 直接在内容变化时调用 save（内部有防抖）
  useEffect(() => {
    draft.save({ title, content, tags, recordType });
  }, [title, content, tags, recordType]);

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();
    
    if (publish) {
      if (!confirm('确定要发布这条今日美好吗？\n\n发布后，这条内容将展示在广场上，所有用户都能看到。')) {
        return;
      }
    }
    
    setLoading(true);
    try {
      const data: RecordCreate = {
        title: title || undefined,
        content,
        record_type: recordType,
        status: publish ? 'published' : 'draft',
        is_public: publish,
        tags: tags,
      };
      
      const newRecord = await recordsApi.createRecord(data);
      draft.clear();
      if (publish) {
        alert('发布成功！您的今日美好已展示在广场上。');
      }
      navigate(`/records/${newRecord.id}`);
    } catch (error) {
      console.error('Failed to create record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const hasContent = title.trim() || content.trim() || tags.length > 0;
    
    if (hasContent) {
      const shouldSave = confirm('您有未保存的内容，是否保存为草稿？\n\n点击"确定"保存为草稿\n点击"取消"不保存直接返回');
      
      if (shouldSave) {
        handleSubmit(new Event('submit') as any, false);
      } else {
        draft.clear();
        navigate('/records');
      }
    } else {
      draft.clear();
      navigate('/records');
    }
  };

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/records')}
          className="text-gray-600 hover:text-gray-900"
        >
          ← 返回美好列表
        </button>
        <h1 className="text-2xl font-bold text-gray-900">新建美好</h1>
      </div>

      <form className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6 transition-colors duration-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            标题（可选）
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
            placeholder="输入标题..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            类型
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                value="note"
                checked={recordType === 'note'}
                onChange={(e) => setRecordType(e.target.value as any)}
                className="mr-2"
              />
              笔记
            </label>
            <label className="flex items-center text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                value="idea"
                checked={recordType === 'idea'}
                onChange={(e) => setRecordType(e.target.value as any)}
                className="mr-2"
              />
              想法
            </label>
            <label className="flex items-center text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                value="log"
                checked={recordType === 'log'}
                onChange={(e) => setRecordType(e.target.value as any)}
                className="mr-2"
              />
              日志
            </label>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            内容
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="写下你的想法..."
            className="min-h-[300px]"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            标签
          </label>
          <TagInput
            value={tags}
            onChange={setTags}
            placeholder="输入标签，按回车添加..."
            maxTags={10}
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e, false);
            }}
            disabled={loading || !content.trim()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '保存中...' : '保存为草稿'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e, true);
            }}
            disabled={loading || !content.trim()}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-md hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {loading ? '发布中...' : '发布到广场'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
};
