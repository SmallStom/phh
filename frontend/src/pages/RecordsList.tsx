import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { recordsApi } from '../api/records';
import { useAuthStore } from '../store/authStore';
import { formatDateTime } from '../utils/dateUtils';
import type { Record } from '../types/record';

export const RecordsList: React.FC = () => {
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [quickContent, setQuickContent] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTags, setQuickTags] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  useEffect(() => {
    initializeAuth();
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadRecords();
    }
  }, [page, isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('fromSearch', 'false');
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await recordsApi.getRecords({ page, page_size: 20 });
      setRecords(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRecord = async (publish: boolean = false) => {
    if (!quickContent.trim()) return;
    
    if (publish) {
      if (!confirm('确定要发布这条今日美好吗？\n\n发布后，这条内容将展示在广场上，所有用户都能看到。')) {
        return;
      }
    }
    
    setQuickLoading(true);
    try {
      const tagList = quickTags ? quickTags.split(/[,，;；]/).map(t => t.trim()).filter(t => t) : [];
      const newRecord = await recordsApi.createRecord({
        title: quickTitle || undefined,
        content: quickContent,
        status: publish ? 'published' : 'draft',
        record_type: 'note',
        is_public: publish,
        tags: tagList,
      });
      setQuickTitle('');
      setQuickContent('');
      setQuickTags('');
      loadRecords();
      if (publish) {
        alert('发布成功！您的今日美好已展示在广场上。');
      }
      window.location.href = `/records/${newRecord.id}`;
    } catch (error) {
      console.error('Failed to create record:', error);
    } finally {
      setQuickLoading(false);
    }
  };

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-gray-600 text-lg mb-6">请先登录以访问今日美好</p>
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">今日美好</h1>
            <p className="text-gray-600">管理你的所有笔记、想法和日志</p>
          </div>
          <Link
            to="/records/new"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            + 新建美好
          </Link>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-3">✨</span>
            快速记录
          </h2>
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="输入标题（可选）"
            className="w-full px-4 py-2 mb-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 transition-all"
          />
          <textarea
            value={quickContent}
            onChange={(e) => setQuickContent(e.target.value)}
            placeholder="写下你的想法..."
            className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-700 placeholder-gray-400 transition-all"
          />
          <div className="mt-4">
            <input
              type="text"
              value={quickTags}
              onChange={(e) => setQuickTags(e.target.value)}
              placeholder="添加标签（用逗号分隔，如：工作, 重要, 待办）"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 transition-all"
            />
          </div>
          <div className="flex justify-end mt-4 space-x-4">
            <button
              onClick={() => handleQuickRecord(false)}
              disabled={quickLoading || !quickContent.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-medium"
            >
              {quickLoading ? '保存中...' : '保存为草稿'}
            </button>
            <button
              onClick={() => handleQuickRecord(true)}
              disabled={quickLoading || !quickContent.trim()}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-medium"
            >
              {quickLoading ? '发布中...' : '发布到广场'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-500 text-lg">还没有记录，开始创建第一条吧！</p>
          </div>
        ) : (
          <div className="space-y-6">
            {records.map((record) => (
              <Link
                key={record.id}
                to={`/records/${record.id}`}
                onClick={() => localStorage.setItem('fromSource', 'recordsList')}
                className="block bg-white rounded-2xl shadow-md p-8 hover:shadow-xl transition-all border border-gray-100 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex-1">
                    {record.title || '无标题'}
                  </h2>
                  <span className={`px-4 py-2 text-sm rounded-full font-medium ${
                    record.status === 'published' ? 'bg-green-100 text-green-700' :
                    record.status === 'archived' ? 'bg-gray-100 text-gray-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {record.status === 'published' ? '✓ 已发布' : record.status === 'archived' ? '📦 已归档' : '📝 草稿'}
                  </span>
                </div>
                <p className="text-gray-600 line-clamp-3 mb-4 leading-relaxed text-lg">
                  {record.content}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
                    {record.record_type === 'note' ? '📝 笔记' : record.record_type === 'idea' ? '💡 想法' : '📅 日志'}
                  </span>
                  <span className="flex items-center">
                    <span className="mr-1">📅</span>
                    {formatDateTime(record.created_at)}
                  </span>
                  {record.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex space-x-1">
                        {record.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-blue-600 font-medium">#{tag}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {total > 20 && (
          <div className="flex justify-center mt-12 space-x-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md border border-gray-200 font-medium"
            >
              ← 上一页
            </button>
            <span className="px-6 py-3 bg-white text-gray-700 rounded-xl shadow-md border border-gray-200 font-medium">
              第 {page} 页
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md border border-gray-200 font-medium"
            >
              下一页 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
