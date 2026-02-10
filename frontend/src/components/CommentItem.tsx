import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatRelativeTime } from '../utils/time';
import { commentsApi } from '../api/comments';
import { MentionText } from './mentions/MentionText';
import type { Comment } from '../types/comment';

interface CommentItemProps {
  comment: Comment;
  recordId: string;
  currentUserId?: string;
  depth?: number;
  onReply: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  recordId,
  currentUserId,
  depth = 0,
  onReply,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesPage, setRepliesPage] = useState(1);
  const [hasMoreReplies, setHasMoreReplies] = useState(comment.reply_count > 0);

  const isOwner = currentUserId === comment.user_id;
  const maxDepth = 3; // 最大嵌套深度
  const canNest = depth < maxDepth;

  const handleUserClick = () => {
    if (comment.user) {
      navigate(`/users/${comment.user_id}`);
    }
  };

  const handleReplyClick = () => {
    onReply(comment);
  };

  const handleDeleteClick = async () => {
    if (!isOwner) return;
    
    if (window.confirm('确定要删除这条评论吗？')) {
      try {
        await commentsApi.deleteComment(comment.id);
        onDelete(comment.id);
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  const handleToggleReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    // 如果已经有回复数据，直接显示
    if (replies.length > 0) {
      setShowReplies(true);
      return;
    }

    // 否则加载回复
    await loadReplies();
  };

  const loadReplies = async (page: number = 1) => {
    if (loadingReplies) return;

    setLoadingReplies(true);
    try {
      const response = await commentsApi.getCommentReplies(recordId, comment.id, {
        page,
        page_size: 10,
      });

      if (page === 1) {
        setReplies(response.data);
      } else {
        setReplies((prev) => [...prev, ...response.data]);
      }

      setRepliesPage(page);
      setHasMoreReplies(response.data.length === 10 && replies.length + response.data.length < response.total);
      setShowReplies(true);
    } catch (error) {
      console.error('Failed to load replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleLoadMoreReplies = () => {
    loadReplies(repliesPage + 1);
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <button
          onClick={handleUserClick}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white font-medium flex-shrink-0 hover:opacity-90 transition-opacity overflow-hidden"
        >
          {comment.user?.avatar ? (
            <img src={comment.user.avatar} alt={comment.user.username} className="w-full h-full object-cover" />
          ) : (
            comment.user?.username.charAt(0).toUpperCase()
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={handleUserClick}
              className="font-medium text-[var(--text-primary)] hover:text-[var(--accent-color)] transition-colors"
            >
              {comment.user?.username || '未知用户'}
            </button>
            
            {/* 回复给哪个用户 */}
            {comment.reply_to_user && (
              <>
                <span className="text-[var(--text-muted)]">回复</span>
                <button
                  onClick={() => navigate(`/users/${comment.reply_to_user_id}`)}
                  className="text-[var(--accent-color)] hover:underline"
                >
                  @{comment.reply_to_user.username}
                </button>
              </>
            )}
            
            <span className="text-xs text-[var(--text-muted)]">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>

          {/* Content */}
          <div className="text-[var(--text-secondary)] whitespace-pre-wrap">
            <MentionText content={comment.content} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            {canNest && (
              <button
                onClick={handleReplyClick}
                className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--accent-color)] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>回复</span>
              </button>
            )}

            {isOwner && !comment.is_deleted && (
              <button
                onClick={handleDeleteClick}
                className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除</span>
              </button>
            )}

            {/* 显示/隐藏回复 */}
            {comment.reply_count > 0 && canNest && (
              <button
                onClick={handleToggleReplies}
                className="flex items-center gap-1 text-sm text-[var(--accent-color)] hover:opacity-80 transition-opacity"
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>收起回复</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>查看 {comment.reply_count} 条回复</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Nested Replies */}
          {showReplies && replies.length > 0 && (
            <div className="mt-3">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  recordId={recordId}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                  onReply={onReply}
                  onDelete={(id) => {
                    setReplies((prev) => prev.filter((r) => r.id !== id));
                  }}
                />
              ))}

              {/* Load More Replies */}
              {hasMoreReplies && (
                <button
                  onClick={handleLoadMoreReplies}
                  disabled={loadingReplies}
                  className="ml-8 mt-2 text-sm text-[var(--accent-color)] hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {loadingReplies ? '加载中...' : '加载更多回复'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
