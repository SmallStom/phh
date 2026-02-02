import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { recordsApi } from '../api/records';
import { collectionsApi } from '../api/collections';
import { likesApi } from '../api/likes';
import { commentsApi } from '../api/comments';
import { useAuthStore } from '../store/authStore';
import { formatDateTime } from '../utils/dateUtils';
import type { Record as UserRecord, RecordUpdate } from '../types/record';
import type { Comment } from '../types/comment';

const typeIcons: Record<string, { icon: string; label: string; color: string }> = {
  note: { icon: '✦', label: '笔记', color: 'bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-300' },
  idea: { icon: '◆', label: '想法', color: 'bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/30 dark:text-terracotta-300' },
  log: { icon: '●', label: '日志', color: 'bg-sand-200 text-sand-800 dark:bg-sand-800 dark:text-sand-200' },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-sand-200 text-sand-800 dark:bg-sand-800 dark:text-sand-200' },
  published: { label: '已发布', color: 'bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-300' },
  archived: { label: '已归档', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

export const RecordDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [record, setRecord] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<RecordUpdate>({});
  const [authChecked, setAuthChecked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [fromSource] = useState<string | null>(() => localStorage.getItem('fromSource'));
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [totalComments, setTotalComments] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => { initializeAuth(); setAuthChecked(true); }, []);

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (id && authChecked && !record) loadRecord(id);
  }, [id, authChecked, record]);

  const loadRecord = async (recordId: string) => {
    try {
      setLoading(true);
      let data: UserRecord;
      
      if (isAuthenticated) {
        try { data = await recordsApi.getRecord(recordId); } 
        catch { data = await recordsApi.getPublicRecord(recordId); }
      } else {
        data = await recordsApi.getPublicRecord(recordId);
      }
      
      setRecord(data);
      setEditData({
        title: data.title,
        content: data.content,
        status: data.status,
        record_type: data.record_type,
        is_public: data.is_public,
      });
      
      setLikeCount(data.like_count);
      setTotalComments(data.comment_count);

      if (data.status !== 'draft') {
        if (isAuthenticated) {
          try {
            const checkResult = await collectionsApi.checkCollected('record', recordId);
            setIsCollected(checkResult.is_collected);
          } catch { setIsCollected(false); }
          
          try {
            const likeStatus = await likesApi.getLikeStatus(recordId);
            setIsLiked(likeStatus.is_liked);
            setLikeCount(likeStatus.like_count);
          } catch { setIsLiked(false); }
        } else {
          try {
            const likeStatus = await likesApi.getPublicLikeStatus(recordId);
            setLikeCount(likeStatus.like_count);
          } catch { setLikeCount(0); }
        }
        loadComments(recordId);
      }
    } catch (error) {
      console.error('Failed to load record:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (recordId: string) => {
    try {
      setLoadingComments(true);
      const response = await commentsApi.getComments(recordId, { page: 1, page_size: 20 });
      setComments(response.data);
      setTotalComments(response.total);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleUpdate = async () => {
    if (!record) return;
    try {
      const updated = await recordsApi.updateRecord(record.id, editData);
      setRecord(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update record:', error);
    }
  };

  const handlePublish = async () => {
    if (!record) return;
    if (!confirm('确定要发布这条今日美好吗？\n\n发布后，这条内容将展示在广场上，所有用户都能看到。')) return;
    
    try {
      const updated = await recordsApi.publishRecord(record.id);
      setRecord(updated);
      alert('发布成功！您的今日美好已展示在广场上。');
    } catch (error) {
      console.error('Failed to publish record:', error);
    }
  };

  const handleDelete = async () => {
    if (!record || !confirm('确定要删除这条记录吗？')) return;
    try {
      await recordsApi.deleteRecord(record.id);
      navigate('/records');
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  const getBackButtonText = () => {
    if (fromSource === 'plaza') return '← 返回广场';
    if (fromSource === 'recordsList') return '← 返回今日美好';
    if (fromSource === 'collections') return '← 返回收藏';
    return '← 返回今日美好';
  };

  const handleBack = () => {
    if (fromSource === 'plaza') {
      localStorage.removeItem('fromSource');
      const plazaPage = localStorage.getItem('plazaPage') || '1';
      const plazaPageSize = localStorage.getItem('plazaPageSize') || '20';
      const plazaSearched = localStorage.getItem('plazaSearched') === 'true';
      navigate(`/?page=${plazaPage}&pageSize=${plazaPageSize}${plazaSearched ? '&searched=true' : ''}`);
    } else if (fromSource === 'recordsList') {
      localStorage.removeItem('fromSource');
      navigate('/records');
    } else if (fromSource === 'collections') {
      localStorage.removeItem('fromSource');
      navigate('/collections');
    } else {
      navigate('/records');
    }
  };

  const handleCollect = async () => {
    if (!record) return;
    try {
      if (isCollected) {
        await collectionsApi.uncollectContent('record', record.id);
        setIsCollected(false);
        alert('已取消收藏');
      } else {
        await collectionsApi.collectContent('record', record.id);
        setIsCollected(true);
        alert('收藏成功！');
      }
    } catch (error) {
      console.error('Failed to collect/uncollect record:', error);
      alert('操作失败，请重试');
    }
  };

  const handleLike = async () => {
    if (!record || !isAuthenticated) { alert('请先登录'); return; }
    try {
      if (isLiked) {
        await likesApi.unlikeRecord(record.id);
        setIsLiked(false);
        setLikeCount(likeCount - 1);
      } else {
        await likesApi.likeRecord(record.id);
        setIsLiked(true);
        setLikeCount(likeCount + 1);
      }
    } catch (error) {
      console.error('Failed to like/unlike record:', error);
      alert('操作失败，请重试');
    }
  };

  const handleSubmitComment = async () => {
    if (!record || !isAuthenticated) { alert('请先登录'); return; }
    if (!commentInput.trim()) { alert('请输入评论内容'); return; }
    try {
      const newComment = await commentsApi.createComment(record.id, { content: commentInput });
      setComments([newComment, ...comments]);
      setCommentInput('');
      setTotalComments(totalComments + 1);
      if (record) setRecord({ ...record, comment_count: record.comment_count + 1 });
    } catch (error) {
      console.error('Failed to create comment:', error);
      alert('评论失败，请重试');
    }
  };

  // 保留此函数供将来使用 - 删除评论功能
  // const handleDeleteComment = async (commentId: string) => {
  //   if (!confirm('确定要删除这条评论吗？')) return;
  //   try {
  //     await commentsApi.deleteComment(commentId);
  //     setComments(comments.filter(c => c.id !== commentId));
  //     setTotalComments(totalComments - 1);
  //     if (record) setRecord({ ...record, comment_count: record.comment_count - 1 });
  //   } catch (error) {
  //     console.error('Failed to delete comment:', error);
  //     alert('删除失败，请重试');
  //   }
  // };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-pulse text-[var(--text-secondary)]">加载中...</div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="animate-pulse text-[var(--text-secondary)]">加载中...</div>
    </div>
  );
  
  if (!record) return (
    <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-[var(--text-secondary)]">记录不存在</div>
    </div>
  );

  const typeInfo = typeIcons[record.record_type] || typeIcons.note;
  const statusInfo = statusLabels[record.status] || statusLabels.draft;

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* 顶部导航栏 - 固定在内容上方 */}
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
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium
                           bg-[var(--bg-secondary)] text-[var(--text-secondary)] 
                           hover:bg-forest-50 hover:text-forest-600 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>{isEditing ? '取消' : '编辑'}</span>
                </button>
                
                {record.status !== 'published' && (
                  <button
                    onClick={handlePublish}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium
                             bg-forest-500 text-white hover:bg-forest-600 
                             transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M5 13l4 4L19 7" />
                    </svg>
                    <span>发布</span>
                  </button>
                )}
                
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
      <div className="max-w-4xl mx-auto px-4 pt-24">
        {isEditing ? (
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-card p-6 md:p-8 space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                标题
              </label>
              <input
                type="text"
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] 
                         rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 
                         focus:ring-terracotta-500/50 transition-all duration-300"
                placeholder="输入标题..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                内容
              </label>
              <textarea
                value={editData.content || ''}
                onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                className="w-full h-64 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] 
                         rounded-xl text-[var(--text-primary)] resize-none focus:outline-none 
                         focus:ring-2 focus:ring-terracotta-500/50 transition-all duration-300"
                placeholder="写下你的美好瞬间..."
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  状态
                </label>
                <select
                  value={editData.status || 'draft'}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                  className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] 
                           rounded-xl text-[var(--text-primary)] focus:outline-none 
                           focus:ring-2 focus:ring-terracotta-500/50"
                >
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="archived">已归档</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  类型
                </label>
                <select
                  value={editData.record_type || 'note'}
                  onChange={(e) => setEditData({ ...editData, record_type: e.target.value as any })}
                  className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] 
                           rounded-xl text-[var(--text-primary)] focus:outline-none 
                           focus:ring-2 focus:ring-terracotta-500/50"
                >
                  <option value="note">笔记</option>
                  <option value="idea">想法</option>
                  <option value="log">日志</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleUpdate}
              className="w-full bg-terracotta-500 text-white py-3 rounded-xl font-medium
                       hover:bg-terracotta-600 transition-all duration-300 
                       shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              保存修改
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 文章内容卡片 */}
            <article className="bg-[var(--card-bg)] rounded-2xl shadow-card p-6 md:p-8 animate-fade-in">
              {/* 类型和状态标签 */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color}`}>
                  <span>{typeInfo.icon}</span>
                  <span>{typeInfo.label}</span>
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
                <span className="text-sm text-[var(--text-muted)]">
                  {formatDateTime(record.created_at)}
                </span>
              </div>

              {/* 标题 */}
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-6 
                           heading-display leading-tight">
                {record.title || '无标题'}
              </h1>
              
              {/* 内容 */}
              <div className="prose prose-lg max-w-none">
                <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {record.content}
                </p>
              </div>
              
              {/* 图片展示 */}
              {record.image_urls && record.image_urls.length > 0 && (
                <div className="mt-8">
                  <div className={`grid gap-4 ${
                    record.image_urls.length === 1 
                      ? 'grid-cols-1' 
                      : record.image_urls.length === 2 
                        ? 'grid-cols-2' 
                        : 'grid-cols-2 md:grid-cols-3'
                  }`}>
                    {record.image_urls.map((url, index) => (
                      <div 
                        key={index} 
                        className="relative aspect-video rounded-xl overflow-hidden bg-[var(--bg-secondary)] 
                                 cursor-pointer hover:opacity-90 transition-all duration-300 
                                 hover:scale-[1.02] shadow-md"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <img
                          src={url}
                          alt={`图片 ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 标签 */}
              {record.tags.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {record.tags.map((tag) => (
                    <span key={tag} 
                          className="px-3 py-1 bg-terracotta-50 text-terracotta-600 
                                   dark:bg-terracotta-900/20 dark:text-terracotta-300
                                   rounded-full text-sm font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </article>

            {/* 点赞和评论统计 */}
            {record.status !== 'draft' && (
              <>
                <div className="bg-[var(--card-bg)] rounded-2xl shadow-card p-6 animate-fade-in">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${
                        isLiked 
                          ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      <span className="text-xl">{isLiked ? '❤️' : '🤍'}</span>
                      <span className="font-medium">{likeCount}</span>
                    </button>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <span className="text-xl">💬</span>
                      <span className="font-medium">{totalComments}</span>
                      <span>条评论</span>
                    </div>
                  </div>
                </div>

                {/* 评论区 */}
                <div className="bg-[var(--card-bg)] rounded-2xl shadow-card p-6 md:p-8 animate-fade-in">
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 heading-display">
                    评论
                  </h2>
                  
                  {isAuthenticated ? (
                    <div className="mb-8">
                      <textarea
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="写下你的评论..."
                        className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] 
                                 rounded-xl text-[var(--text-primary)] resize-none focus:outline-none 
                                 focus:ring-2 focus:ring-terracotta-500/50 transition-all duration-300"
                        rows={3}
                      />
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={handleSubmitComment}
                          disabled={!commentInput.trim()}
                          className="px-6 py-2.5 bg-terracotta-500 text-white rounded-xl font-medium
                                   hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed 
                                   transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                          发表评论
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-8 p-6 bg-[var(--bg-secondary)] rounded-xl text-center text-[var(--text-secondary)]">
                      请登录后发表评论
                    </div>
                  )}

                  {loadingComments ? (
                    <div className="text-center py-8 text-[var(--text-secondary)]">加载评论中...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-secondary)]">
                      暂无评论，快来发表第一条评论吧！
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} 
                             className="p-4 bg-[var(--bg-secondary)] rounded-xl 
                                      border border-[var(--border-color)]/50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-[var(--text-primary)]">
                              {comment.user?.username || '匿名用户'}
                            </span>
                            <span className="text-sm text-[var(--text-muted)]">
                              {formatDateTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-[var(--text-secondary)]">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
