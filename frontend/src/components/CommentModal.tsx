import { useState, useEffect, useRef } from 'react';
import { commentsApi } from '../api/comments';
import { CommentItem } from './CommentItem';
import { MentionInput } from './mentions/MentionInput';
import { useAuthStore } from '../store/authStore';
import type { Comment } from '../types/comment';
import { X, Loader2, CornerDownLeft } from 'lucide-react';

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
  const { user: currentUser } = useAuthStore();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // 回复状态
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

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
      const commentData = {
        content: newComment.trim(),
        parent_id: replyTo?.id,
        reply_to_user_id: replyTo?.user_id,
      };
      
      await commentsApi.createComment(recordId, commentData);
      setNewComment('');
      setReplyTo(null);
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
  const handleDelete = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setTotal((prev) => Math.max(0, prev - 1));
    onCommentAdded?.();
  };

  // 处理回复
  const handleReply = (comment: Comment) => {
    setReplyTo(comment);
    // 聚焦输入框
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // 取消回复
  const handleCancelReply = () => {
    setReplyTo(null);
  };

  // 打开时加载评论并聚焦输入框
  useEffect(() => {
    if (isOpen) {
      loadComments();
      setReplyTo(null);
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              💬 评论 ({total})
            </h3>
            {recordTitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[400px]">
                {recordTitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 评论列表 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">💭</div>
              <p>还没有评论，来说点什么吧~</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                recordId={recordId}
                currentUserId={currentUser?.id}
                depth={0}
                onReply={handleReply}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* 输入框 */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {/* 回复提示 */}
          {replyTo && (
            <div className="flex items-center justify-between mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <CornerDownLeft className="w-4 h-4" />
                <span>回复 @{replyTo.user?.username}</span>
              </div>
              <button
                onClick={handleCancelReply}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                取消
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <div className="flex-1">
              <MentionInput
                value={newComment}
                onChange={setNewComment}
                placeholder={replyTo ? `回复 @${replyTo.user?.username}...` : "写下你的评论... 使用 @ 提及用户 (Cmd+Enter 发送)"}
                rows={2}
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
