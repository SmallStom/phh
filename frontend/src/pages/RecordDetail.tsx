import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { recordsApi } from '../api/records';
import { collectionsApi } from '../api/collections';
import { likesApi } from '../api/likes';
import { commentsApi } from '../api/comments';
import { useAuthStore } from '../store/authStore';
import { formatDateTime } from '../utils/dateUtils';
import type { Record, RecordUpdate } from '../types/record';
import type { Comment } from '../types/comment';

export const RecordDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<RecordUpdate>({});
  const [authChecked, setAuthChecked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [fromSource] = useState<string | null>(() => {
    return localStorage.getItem('fromSource');
  });
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [totalComments, setTotalComments] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    initializeAuth();
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (id && authChecked && !record) {
      loadRecord(id);
    }
  }, [id, authChecked, record]);

  const loadRecord = async (recordId: string) => {
    try {
      setLoading(true);
      
      let data: Record;
      
      if (isAuthenticated) {
        try {
          data = await recordsApi.getRecord(recordId);
        } catch {
          data = await recordsApi.getPublicRecord(recordId);
        }
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
          } catch {
            setIsCollected(false);
          }
          
          try {
            const likeStatus = await likesApi.getLikeStatus(recordId);
            setIsLiked(likeStatus.is_liked);
            setLikeCount(likeStatus.like_count);
          } catch {
            setIsLiked(false);
          }
        } else {
          try {
            const likeStatus = await likesApi.getPublicLikeStatus(recordId);
            setLikeCount(likeStatus.like_count);
          } catch {
            setLikeCount(0);
          }
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
    
    if (!confirm('确定要发布这条今日美好吗？\n\n发布后，这条内容将展示在广场上，所有用户都能看到。')) {
      return;
    }
    
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
    if (fromSource === 'recordsList') return '← 返回列表';
    return '← 返回列表';
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
    if (!record || !isAuthenticated) {
      alert('请先登录');
      return;
    }

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
    if (!record || !isAuthenticated) {
      alert('请先登录');
      return;
    }

    if (!commentInput.trim()) {
      alert('请输入评论内容');
      return;
    }

    try {
      const newComment = await commentsApi.createComment(record.id, { content: commentInput });
      setComments([newComment, ...comments]);
      setCommentInput('');
      setTotalComments(totalComments + 1);
      if (record) {
        setRecord({ ...record, comment_count: record.comment_count + 1 });
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
      alert('评论失败，请重试');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return;

    try {
      await commentsApi.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      setTotalComments(totalComments - 1);
      if (record) {
        setRecord({ ...record, comment_count: record.comment_count - 1 });
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('删除失败，请重试');
    }
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (loading) return <div className="text-center py-8">加载中...</div>;
  if (!record) return <div className="text-center py-8">记录不存在</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleBack}
          className="text-gray-600 hover:text-gray-900"
        >
          {getBackButtonText()}
        </button>
        {isAuthenticated && (
          <div className="space-x-2">
            <button
              onClick={handleCollect}
              className={`px-4 py-2 text-white rounded-md ${
                isCollected ? 'bg-gray-500 hover:bg-gray-600' : 'bg-yellow-500 hover:bg-yellow-600'
              }`}
            >
              {isCollected ? '已收藏' : '收藏'}
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {isEditing ? '取消' : '编辑'}
            </button>
            {record.status !== 'published' && (
              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                发布
              </button>
            )}
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              删除
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题
            </label>
            <input
              type="text"
              value={editData.title || ''}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              内容
            </label>
            <textarea
              value={editData.content || ''}
              onChange={(e) => setEditData({ ...editData, content: e.target.value })}
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md resize-none"
            />
          </div>
          
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状态
              </label>
              <select
                value={editData.status || 'draft'}
                onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="archived">已归档</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                类型
              </label>
              <select
                value={editData.record_type || 'note'}
                onChange={(e) => setEditData({ ...editData, record_type: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="note">笔记</option>
                <option value="idea">想法</option>
                <option value="log">日志</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleUpdate}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {record.title || '无标题'}
            </h1>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
              <span>{record.record_type}</span>
              <span>•</span>
              <span>{formatDateTime(record.created_at)}</span>
              <span>•</span>
              <span className={`px-2 py-1 rounded ${
                record.status === 'published' ? 'bg-green-100 text-green-700' :
                record.status === 'archived' ? 'bg-gray-100 text-gray-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {record.status}
              </span>
            </div>
            
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{record.content}</p>
            </div>
            
            {record.tags.length > 0 && (
              <div className="mt-6 flex space-x-2">
                {record.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {record.status !== 'draft' && (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isLiked 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-xl">{isLiked ? '❤️' : '🤍'}</span>
                    <span className="font-medium">{likeCount}</span>
                  </button>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span className="text-xl">💬</span>
                    <span className="font-medium">{totalComments}</span>
                    <span>条评论</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">评论</h2>
                
                {isAuthenticated ? (
                  <div className="mb-6">
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="写下你的评论..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleSubmitComment}
                        disabled={!commentInput.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        发表评论
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-gray-600">
                    请登录后发表评论
                  </div>
                )}

                {loadingComments ? (
                  <div className="text-center py-8 text-gray-500">加载评论中...</div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">暂无评论，快来发表第一条评论吧！</div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">
                                {comment.user?.username || '匿名用户'}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDateTime(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                          </div>
                          {isAuthenticated && comment.user_id === record?.user_id && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="ml-4 text-red-600 hover:text-red-700 text-sm"
                            >
                              删除
                            </button>
                          )}
                        </div>
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
  );
};
