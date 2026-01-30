import { useState, useEffect, useRef } from 'react';
import { commentsApi } from '../api/comments';
import type { Comment } from '../types/comment';
import { formatRelativeTime } from '../utils/time';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string;
  recordTitle?: string;
  onCommentAdded?: () => void;
}

export default function CommentModal({ 
  isOpen, 
  onClose, 
  recordId, 
  recordTitle,
  onCommentAdded 
}: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 加载评论列表
  const loadComments = async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      const response = await commentsApi.getComments(recordId, { page: 1, page_size: 50 });
      setComments(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // 提交评论
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newComment.trim() || !recordId) return;

    setSubmitting(true);
    try {
      await commentsApi.createComment(recordId, { content: newComment.trim() });
      setNewComment('');
      await loadComments();
      onCommentAdded?.();
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('评论失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除评论
  const handleDelete = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    try {
      await commentsApi.deleteComment(commentId);
      await loadComments();
      onCommentAdded?.();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('删除失败，请重试');
    }
  };

  // 打开时加载评论并聚焦输入框
  useEffect(() => {
    if (isOpen) {
      loadComments();
      // 延迟聚焦，等待动画完成
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, recordId]);

  // 点击外部关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 按 ESC 关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              💬 评论 ({total})
            </h3>
            {recordTitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[280px]">
                {recordTitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 评论列表 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">💭</div>
              <p>还没有评论，来说点什么吧~</p>
            </div>
          ) : (
            comments.map((comment, index) => (
              <div 
                key={comment.id}
                className={`flex space-x-3 ${index !== comments.length - 1 ? 'pb-4 border-b border-gray-100 dark:border-gray-700' : ''}`}
              >
                {/* 头像 */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium">
                    {comment.user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                </div>
                
                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {comment.user?.username || '未知用户'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {comment.content}
                  </p>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-3 mt-2">
                    <button className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
                      回复
                    </button>
                    {/* 只有自己的评论才能删除 */}
                    {comment.user_id === localStorage.getItem('user_id') && (
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 输入框 */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) {
                    handleSubmit();
                  }
                }}
                placeholder="写下你的评论... (Cmd+Enter 发送)"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
                maxLength={500}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">
                  {newComment.length}/500
                </span>
                <span className="text-xs text-gray-400">
                  Cmd + Enter 发送
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium self-end"
            >
              {submitting ? '发送中...' : '发送'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
