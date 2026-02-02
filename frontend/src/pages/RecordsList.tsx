import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { recordsApi } from '../api/records';
import { useAuthStore } from '../store/authStore';
import { formatDateTime } from '../utils/dateUtils';
import type { Record as UserRecord } from '../types/record';

const typeIcons: Record<string, { icon: string; label: string; color: string }> = {
  note: { icon: '✦', label: '笔记', color: 'bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-300' },
  idea: { icon: '◆', label: '想法', color: 'bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/30 dark:text-terracotta-300' },
  log: { icon: '●', label: '日志', color: 'bg-sand-200 text-sand-800 dark:bg-sand-800 dark:text-sand-200' },
};

const statusLabels: Record<string, { label: string; icon: string; color: string }> = {
  draft: { label: '草稿', icon: '✎', color: 'bg-sand-200 text-sand-800 dark:bg-sand-800 dark:text-sand-200' },
  published: { label: '已发布', icon: '✓', color: 'bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-300' },
  archived: { label: '已归档', icon: '◆', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

export const RecordsList: React.FC = () => {
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [records, setRecords] = useState<UserRecord[]>([]);
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

  // 恢复滚动位置 - 在数据加载完成后执行
  useEffect(() => {
    if (!loading && records.length > 0) {
      const savedScrollY = localStorage.getItem('recordsListScrollY');
      if (savedScrollY) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedScrollY));
          localStorage.removeItem('recordsListScrollY');
        });
      }
    }
  }, [loading, records]);

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-terracotta-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">请先登录</h2>
          <p className="text-[var(--text-secondary)] mb-6">登录后即可访问您的今日美好</p>
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
      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2 heading-display">
            今日美好
          </h1>
          <p className="text-[var(--text-secondary)]">记录生活中的每一个美好瞬间</p>
          <div className="decorative-line mt-4" />
        </div>

        {/* 快速记录卡片 */}
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-card p-6 mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">快速记录</h2>
          </div>
          
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="输入标题（可选）"
            className="w-full px-4 py-3 mb-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] 
                     rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)]
                     focus:outline-none focus:ring-2 focus:ring-terracotta-500/50 transition-all duration-300"
          />
          <textarea
            value={quickContent}
            onChange={(e) => setQuickContent(e.target.value)}
            placeholder="写下你的想法..."
            rows={3}
            className="w-full px-4 py-3 mb-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] 
                     rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none
                     focus:outline-none focus:ring-2 focus:ring-terracotta-500/50 transition-all duration-300"
          />
          <input
            type="text"
            value={quickTags}
            onChange={(e) => setQuickTags(e.target.value)}
            placeholder="添加标签（用逗号分隔）"
            className="w-full px-4 py-3 mb-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] 
                     rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)]
                     focus:outline-none focus:ring-2 focus:ring-terracotta-500/50 transition-all duration-300"
          />
          
          <div className="flex flex-wrap gap-3 justify-end">
            <button
              onClick={() => handleQuickRecord(false)}
              disabled={quickLoading || !quickContent.trim()}
              className="px-5 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-xl font-medium
                       hover:bg-sand-200 hover:text-sand-800 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-all duration-300"
            >
              {quickLoading ? '保存中...' : '保存为草稿'}
            </button>
            <button
              onClick={() => handleQuickRecord(true)}
              disabled={quickLoading || !quickContent.trim()}
              className="px-5 py-2.5 bg-terracotta-500 text-white rounded-xl font-medium
                       hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {quickLoading ? '发布中...' : '发布到广场'}
            </button>
          </div>
        </div>

        {/* 新建按钮 */}
        <div className="flex justify-end mb-6">
          <Link
            to="/records/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-500 text-white rounded-xl font-medium
                     hover:bg-forest-600 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建美好
          </Link>
        </div>
        
        {/* 记录列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-terracotta-500 border-t-transparent" />
          </div>
        ) : records.length === 0 ? (
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sand-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-sand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">还没有记录</h3>
            <p className="text-[var(--text-secondary)]">开始创建您的第一条美好记录吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record, index) => {
              const typeInfo = typeIcons[record.record_type] || typeIcons.note;
              const statusInfo = statusLabels[record.status] || statusLabels.draft;
              
              return (
                <Link
                  key={record.id}
                  to={`/records/${record.id}`}
                  onClick={() => {
                    localStorage.setItem('fromSource', 'recordsList');
                    localStorage.setItem('recordsListScrollY', window.scrollY.toString());
                  }}
                  className="block bg-[var(--card-bg)] rounded-xl shadow-card p-5 
                           hover:shadow-card-hover transition-all duration-300 group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-terracotta-600 
                                 transition-colors line-clamp-1 flex-1">
                      {record.title || '无标题'}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${statusInfo.color}`}>
                      <span>{statusInfo.icon}</span>
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>
                  
                  <p className="text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed text-sm">
                    {record.content}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${typeInfo.color}`}>
                      <span>{typeInfo.icon}</span>
                      <span>{typeInfo.label}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDateTime(record.created_at)}
                    </span>
                    {record.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span>•</span>
                        <div className="flex gap-1">
                          {record.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-terracotta-600 dark:text-terracotta-400 font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        
        {/* 分页 */}
        {total > 20 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-[var(--card-bg)] text-[var(--text-secondary)] rounded-xl 
                       hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-all duration-300 shadow-sm"
            >
              ← 上一页
            </button>
            <span className="px-4 py-2 bg-[var(--card-bg)] text-[var(--text-primary)] rounded-xl shadow-sm font-medium">
              第 {page} 页
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="px-4 py-2 bg-[var(--card-bg)] text-[var(--text-secondary)] rounded-xl 
                       hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-all duration-300 shadow-sm"
            >
              下一页 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
