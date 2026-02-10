import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, ArrowLeft, Edit2, Trash2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { recordsApi } from '../api/records';
import { collectionsApi } from '../api/collections';
import { likesApi } from '../api/likes';
import { commentsApi } from '../api/comments';
import { useAuthStore } from '../store/authStore';
import { formatDateTime } from '../utils/dateUtils';
import { HtmlContent } from '../components/HtmlContent';
import { MentionText } from '../components/mentions/MentionText';
import { MentionInput } from '../components/mentions/MentionInput';
import type { Record as UserRecord, RecordUpdate } from '../types/record';
import type { Comment } from '../types/comment';

const typeIcons: Record<string, { icon: string; label: string; color: string }> = {
  note: { icon: '✦', label: '笔记', color: 'bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-300' },
  idea: { icon: '◆', label: '想法', color: 'bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/30 dark:text-terracotta-300' },
  log: { icon: '●', label: '日志', color: 'bg-sand-200 text-sand-800 dark:bg-sand-800 dark:text-sand-200' },
};

export const RecordDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const commentId = searchParams.get('commentId');
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
  const [showActions, setShowActions] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const commentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { initializeAuth(); setAuthChecked(true); }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (id && authChecked && !record) loadRecord(id);
  }, [id, authChecked, record]);

  // 点击外部关闭操作菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      // 只加载顶级评论（没有 parent_id 的评论）
      const response = await commentsApi.getComments(recordId, { 
        page: 1, 
        page_size: 100,
        parent_id: ''  // 空字符串表示顶级评论
      });
      // 初始化每个评论的 replies 为空数组
      const commentsWithReplies = response.data.map(c => ({ ...c, replies: [] }));
      setComments(commentsWithReplies);
      setTotalComments(response.total);
      
      if (commentId) {
        setTimeout(() => {
          const commentElement = commentRefs.current.get(commentId);
          if (commentElement) {
            commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            commentElement.classList.add('ring-2', 'ring-terracotta-500', 'ring-offset-2');
            setTimeout(() => {
              commentElement.classList.remove('ring-2', 'ring-terracotta-500', 'ring-offset-2');
            }, 3000);
          }
        }, 500);
      }
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
    if (!confirm('确定要发布这条记录吗？')) return;
    
    try {
      const updated = await recordsApi.publishRecord(record.id);
      setRecord(updated);
      alert('发布成功！');
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

  const handleBack = () => {
    if (fromSource === 'plaza') {
      localStorage.removeItem('fromSource');
      navigate('/');
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
      } else {
        await collectionsApi.collectContent('record', record.id);
        setIsCollected(true);
      }
    } catch (error) {
      console.error('Failed to collect:', error);
    }
  };

  const handleLike = async () => {
    if (!record) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      if (isLiked) {
        await likesApi.unlikeRecord(record.id);
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await likesApi.likeRecord(record.id);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!record || !commentInput.trim()) return;
    try {
      const commentData: { content: string; reply_to?: string } = { 
        content: commentInput.trim() 
      };
      
      // 如果是回复评论
      if (replyingTo) {
        commentData.reply_to = replyingTo.id;
      }
      
      await commentsApi.createComment(record.id, commentData);
      setCommentInput('');
      setReplyingTo(null);
      
      // 如果是回复，刷新该评论的回复列表并更新回复计数
      if (replyingTo) {
        await loadCommentReplies(replyingTo.id);
        // 更新评论的回复计数
        setComments(prev => prev.map(c => {
          if (c.id === replyingTo.id) {
            return { ...c, reply_count: c.reply_count + 1 };
          }
          return c;
        }));
        // 自动展开该评论的回复
        setExpandedReplies(prev => new Set(prev).add(replyingTo.id));
      } else {
        // 如果是顶级评论，重新加载整个评论列表
        await loadComments(record.id);
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  const handleReplyClick = (comment: Comment) => {
    // 如果已经在回复这条评论，则取消回复
    if (replyingTo?.id === comment.id) {
      setReplyingTo(null);
      return;
    }
    setReplyingTo(comment);
    // 初始化该评论的回复输入
    setReplyInputs(prev => ({ ...prev, [comment.id]: '' }));
  };

  const handleCancelReply = () => {
    if (replyingTo) {
      setReplyInputs(prev => ({ ...prev, [replyingTo.id]: '' }));
    }
    setReplyingTo(null);
  };

  const handleReplyInputChange = (commentId: string, value: string) => {
    setReplyInputs(prev => ({ ...prev, [commentId]: value }));
  };

  const handleSubmitReply = async (comment: Comment) => {
    if (!record || !replyInputs[comment.id]?.trim()) return;
    try {
      await commentsApi.createComment(record.id, {
        content: replyInputs[comment.id].trim(),
        reply_to: comment.id
      });
      
      // 清空该评论的回复输入
      setReplyInputs(prev => ({ ...prev, [comment.id]: '' }));
      setReplyingTo(null);
      
      // 刷新该评论的回复列表
      await loadCommentReplies(comment.id);
      
      // 更新评论的回复计数
      setComments(prev => prev.map(c => {
        if (c.id === comment.id) {
          return { ...c, reply_count: c.reply_count + 1 };
        }
        return c;
      }));
      
      // 自动展开该评论的回复
      setExpandedReplies(prev => new Set(prev).add(comment.id));
    } catch (error) {
      console.error('Failed to submit reply:', error);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
        // 加载回复
        loadCommentReplies(commentId);
      }
      return newSet;
    });
  };

  const loadCommentReplies = async (commentId: string) => {
    try {
      const response = await commentsApi.getCommentReplies(record!.id, commentId, {
        page: 1,
        page_size: 50
      });
      
      // 更新评论的回复列表
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, replies: response.data };
        }
        return c;
      }));
    } catch (error) {
      console.error('Failed to load replies:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: record?.title || '美好记录',
          url: window.location.href,
        });
      } catch { /* 用户取消 */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

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

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] 
                       transition-colors rounded-lg hover:bg-[var(--bg-secondary)]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">返回</span>
            </button>
            
            <div className="flex items-center gap-1">
              <button
                onClick={handleCollect}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isCollected 
                    ? 'text-terracotta-500 bg-terracotta-50 dark:bg-terracotta-900/20' 
                    : 'text-[var(--text-secondary)] hover:text-terracotta-500 hover:bg-[var(--bg-secondary)]'
                }`}
                title={isCollected ? '已收藏' : '收藏'}
              >
                <Bookmark className={`w-5 h-5 ${isCollected ? 'fill-current' : ''}`} />
              </button>
              
              <button
                onClick={handleShare}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] 
                         hover:bg-[var(--bg-secondary)] transition-all duration-200"
                title="分享"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              {isAuthenticated && (
                <div className="relative" ref={actionsRef}>
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] 
                             hover:bg-[var(--bg-secondary)] transition-all duration-200"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  
                  {showActions && (
                    <div className="absolute right-0 top-full mt-2 w-40 py-2 rounded-xl 
                                  bg-[var(--card-bg)] border border-[var(--border-color)] shadow-lg z-50">
                      <button
                        onClick={() => { setIsEditing(true); setShowActions(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] 
                                 hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] 
                                 transition-colors flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        编辑
                      </button>
                      {record.status !== 'published' && (
                        <button
                          onClick={() => { handlePublish(); setShowActions(false); }}
                          className="w-full px-4 py-2 text-left text-sm text-forest-600 
                                   hover:bg-forest-50 transition-colors flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          发布
                        </button>
                      )}
                      <button
                        onClick={() => { handleDelete(); setShowActions(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 
                                 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        {isEditing ? (
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-card p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">标题</label>
              <input
                type="text"
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] 
                         rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 
                         focus:ring-terracotta-500/50 transition-all"
                placeholder="输入标题..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">内容</label>
              <textarea
                value={editData.content || ''}
                onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                className="w-full h-64 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] 
                         rounded-xl text-[var(--text-primary)] resize-none focus:outline-none 
                         focus:ring-2 focus:ring-terracotta-500/50 transition-all"
                placeholder="写下你的美好瞬间..."
              />
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl font-medium
                       bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] transition-all">
                取消
              </button>
              <button onClick={handleUpdate} className="flex-1 py-3 rounded-xl font-medium
                       bg-terracotta-500 text-white hover:bg-terracotta-600 transition-all">
                保存
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 文章内容卡片 */}
            <article className="bg-[var(--card-bg)] rounded-2xl shadow-card overflow-hidden">
              {/* 作者信息头部 */}
              <div className="px-6 pt-6 pb-4 border-b border-[var(--border-color)]/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 
                                  flex items-center justify-center text-white font-medium">
                      {record.user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">
                        {record.user?.username || '匿名用户'}
                      </div>
                      <div className="text-sm text-[var(--text-muted)]">
                        {formatDateTime(record.created_at)}
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color}`}>
                    <span>{typeInfo.icon}</span>
                    <span>{typeInfo.label}</span>
                  </span>
                </div>
              </div>

              {/* 内容区域 */}
              <div className="p-6">
                {/* 标题 */}
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-6 heading-display">
                  {record.title || '无标题'}
                </h1>
                
                {/* 内容 */}
                <div className="prose prose-lg max-w-none">
                  <HtmlContent content={record.content} />
                </div>
                
                {/* 图片展示 */}
                {record.image_urls && record.image_urls.length > 0 && (
                  <div className="mt-8">
                    <div className={`grid gap-3 ${
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
                                   cursor-pointer group"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <img
                            src={url}
                            alt={`图片 ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
                      <span key={tag} className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)]
                                               rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部互动栏 */}
              {record.status !== 'draft' && (
                <div className="px-6 py-4 border-t border-[var(--border-color)]/50 
                              flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-2 transition-all duration-200 ${
                        isLiked ? 'text-red-500' : 'text-[var(--text-secondary)] hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{likeCount}</span>
                    </button>
                    <button
                      onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
                      className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">{totalComments}</span>
                    </button>
                  </div>
                </div>
              )}
            </article>

            {/* 评论区 */}
            {record.status !== 'draft' && (
              <div id="comments" className="bg-[var(--card-bg)] rounded-2xl shadow-card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border-color)]/50">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    评论 ({totalComments})
                  </h2>
                </div>
                
                <div className="p-6">
                  {/* 评论输入框 */}
                  {isAuthenticated ? (
                    <div className="mb-8">
                      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] focus-within:border-terracotta-400 focus-within:ring-1 focus-within:ring-terracotta-400/50 transition-all duration-200">
                        <MentionInput
                          value={commentInput}
                          onChange={setCommentInput}
                          placeholder="写下你的评论..."
                          rows={3}
                          className="border-0 bg-transparent rounded-t-xl"
                        />
                        
                        <div className="flex justify-end px-4 pb-3">
                          <button
                            onClick={handleSubmitComment}
                            disabled={!commentInput.trim()}
                            className="px-5 py-2 bg-terracotta-500 text-white rounded-lg text-sm font-medium
                                     hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed 
                                     transition-all flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            发表评论
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-8 p-4 bg-[var(--bg-secondary)] rounded-xl text-center">
                      <span className="text-[var(--text-secondary)]">请</span>
                      <button onClick={() => navigate('/login')} className="text-terracotta-500 hover:underline mx-1">
                        登录
                      </button>
                      <span className="text-[var(--text-secondary)]">后发表评论</span>
                    </div>
                  )}

                  {/* 评论列表 */}
                  {loadingComments ? (
                    <div className="text-center py-8 text-[var(--text-secondary)]">
                      <div className="animate-spin w-6 h-6 border-2 border-terracotta-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      加载中...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
                      <p className="text-[var(--text-secondary)]">暂无评论，快来发表第一条评论吧</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="group">
                          <div 
                            ref={(el) => { if (el) commentRefs.current.set(comment.id, el); }}
                            className="flex gap-3 p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-secondary)]/80 
                                     transition-all duration-200"
                          >
                            {/* 头像 */}
                            <button
                              onClick={() => comment.user && navigate(`/users/${comment.user_id}`)}
                              className="w-10 h-10 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 
                                        flex items-center justify-center text-white font-medium flex-shrink-0 
                                        hover:opacity-90 transition-opacity overflow-hidden"
                            >
                              {comment.user?.avatar ? (
                                <img src={comment.user.avatar} alt={comment.user.username} className="w-full h-full object-cover" />
                              ) : (
                                comment.user?.username.charAt(0).toUpperCase()
                              )}
                            </button>
                            
                            {/* 内容 */}
                            <div className="flex-1 min-w-0">
                              {/* 头部信息 */}
                              <div className="flex items-center gap-2 mb-1">
                                <button
                                  onClick={() => comment.user && navigate(`/users/${comment.user_id}`)}
                                  className="font-medium text-[var(--text-primary)] hover:text-terracotta-500 transition-colors"
                                >
                                  {comment.user?.username || '匿名用户'}
                                </button>
                                <span className="text-xs text-[var(--text-muted)]">
                                  {formatDateTime(comment.created_at)}
                                </span>
                              </div>
                              
                              {/* 评论内容 */}
                              <div className="text-[var(--text-secondary)] text-sm mb-2">
                                <MentionText content={comment.content} />
                              </div>
                              
                              {/* 操作按钮 */}
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => handleReplyClick(comment)}
                                  className={`flex items-center gap-1 text-xs transition-colors ${
                                    replyingTo?.id === comment.id
                                      ? 'text-terracotta-500'
                                      : 'text-[var(--text-muted)] hover:text-terracotta-500'
                                  }`}
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>{replyingTo?.id === comment.id ? '取消回复' : '回复'}</span>
                                </button>
                                
                                {comment.reply_count > 0 && (
                                  <button
                                    onClick={() => toggleReplies(comment.id)}
                                    className="flex items-center gap-1 text-xs text-terracotta-500 
                                             hover:opacity-80 transition-opacity"
                                  >
                                    {expandedReplies.has(comment.id) ? (
                                      <>
                                        <ChevronUp className="w-3.5 h-3.5" />
                                        <span>收起 {comment.reply_count} 条回复</span>
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3.5 h-3.5" />
                                        <span>查看 {comment.reply_count} 条回复</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* 回复输入框 - 在评论下方显示 */}
                          {replyingTo?.id === comment.id && (
                            <div className="ml-12 mt-3">
                              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] focus-within:border-terracotta-400 focus-within:ring-1 focus-within:ring-terracotta-400/50 transition-all duration-200">
                                <textarea
                                  value={replyInputs[comment.id] || ''}
                                  onChange={(e) => handleReplyInputChange(comment.id, e.target.value)}
                                  placeholder={`回复 ${comment.user?.username}...`}
                                  rows={3}
                                  className="w-full px-4 py-3 bg-transparent border-0 resize-none focus:outline-none text-[var(--text-primary)] text-sm"
                                  autoFocus
                                />
                                
                                <div className="flex justify-end gap-2 px-4 pb-3">
                                  <button
                                    onClick={handleCancelReply}
                                    className="px-4 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] 
                                             transition-colors rounded-lg hover:bg-[var(--bg-secondary)]"
                                  >
                                    取消
                                  </button>
                                  <button
                                    onClick={() => handleSubmitReply(comment)}
                                    disabled={!replyInputs[comment.id]?.trim()}
                                    className="px-4 py-1.5 bg-terracotta-500 text-white rounded-lg text-sm font-medium
                                             hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed 
                                             transition-all flex items-center gap-1.5"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    回复
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* 嵌套回复 */}
                          {expandedReplies.has(comment.id) && comment.replies && comment.replies.length > 0 && (
                            <div className="ml-12 mt-3 space-y-3">
                              {comment.replies.map((reply) => (
                                <div 
                                  key={reply.id}
                                  className="flex gap-3 p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-secondary)]/80 transition-colors"
                                >
                                  <button
                                    onClick={() => reply.user && navigate(`/users/${reply.user_id}`)}
                                    className="w-9 h-9 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 
                                              flex items-center justify-center text-white text-sm font-medium flex-shrink-0 
                                              hover:opacity-90 transition-opacity overflow-hidden"
                                  >
                                    {reply.user?.avatar ? (
                                      <img src={reply.user.avatar} alt={reply.user.username} className="w-full h-full object-cover" />
                                    ) : (
                                      reply.user?.username.charAt(0).toUpperCase()
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <button
                                        onClick={() => reply.user && navigate(`/users/${reply.user_id}`)}
                                        className="font-medium text-[var(--text-primary)] text-sm hover:text-terracotta-500 transition-colors"
                                      >
                                        {reply.user?.username}
                                      </button>
                                      <span className="text-xs text-[var(--text-muted)]">
                                        {formatDateTime(reply.created_at)}
                                      </span>
                                    </div>
                                    <div className="text-[var(--text-secondary)] text-sm leading-relaxed">
                                      <MentionText content={reply.content} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
