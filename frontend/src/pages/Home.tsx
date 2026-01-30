import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { recordsApi } from '../api/records';
import { experiencesApi } from '../api/experiences';
import { collectionsApi } from '../api/collections';
import { likesApi } from '../api/likes';
import { useAuthStore } from '../store/authStore';
import { formatDateTime } from '../utils/dateUtils';
import { HotContent } from '../components/HotContent';
import CommentModal from '../components/CommentModal';
import type { Record } from '../types/record';
import type { Experience } from '../types/experience';
import type { Collection } from '../types/collection';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [publicRecords, setPublicRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [jumpToPage, setJumpToPage] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    records: Record[];
    experiences: Experience[];
    collections: Collection[];
  }>({
    records: [],
    experiences: [],
    collections: [],
  });
  const [searched, setSearched] = useState(false);
  
  // 评论弹窗状态
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);

  // 监听路由变化，恢复搜索状态
  useEffect(() => {
    const savedQuery = localStorage.getItem('searchQuery');
    const savedResultsStr = localStorage.getItem('searchResults');
    
    if (savedQuery && savedResultsStr) {
      try {
        const savedResults = JSON.parse(savedResultsStr);
        setQuery(savedQuery);
        setResults(savedResults);
        setSearched(true);
      } catch (e) {
        console.error('Failed to parse saved search results:', e);
      }
    }
  }, [location.key]);

  // 从 URL 参数恢复页面状态
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pageParam = params.get('page');
    const pageSizeParam = params.get('pageSize');
    const searchedParam = params.get('searched');

    if (pageParam) {
      setPage(parseInt(pageParam));
    }
    if (pageSizeParam) {
      setPageSize(parseInt(pageSizeParam));
    }
    if (searchedParam === 'true') {
      setSearched(true);
    }
  }, [location.key]);

  useEffect(() => {
    initializeAuth();
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!searched) {
      loadPublicRecords();
    }
  }, [page, searched]);

  const loadPublicRecords = async () => {
    try {
      setLoading(true);
      const response = await recordsApi.getPublicRecords({ page, page_size: pageSize });
      setPublicRecords(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load public records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    if (pageNum && pageNum > 0) {
      const maxPage = Math.ceil(total / pageSize);
      const targetPage = Math.min(pageNum, maxPage);
      setPage(targetPage);
      setJumpToPage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (jumpToPage) {
        handleJumpToPage();
      } else {
        handleSearch();
      }
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const [recordsRes, experiencesRes, collectionsRes] = await Promise.all([
        recordsApi.getPublicRecords({ search: query, page_size: 10 }),
        experiencesApi.getExperiences({ page_size: 10 }),
        isAuthenticated ? collectionsApi.getCollections({ search: query, page_size: 10 }) : Promise.resolve({ data: [] }),
      ]);
      
      const searchResults = {
        records: recordsRes.data,
        experiences: experiencesRes.data,
        collections: collectionsRes.data,
      };
      
      setResults(searchResults);
      localStorage.setItem('searchQuery', query);
      localStorage.setItem('searchResults', JSON.stringify(searchResults));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setSearched(false);
    localStorage.removeItem('searchQuery');
    localStorage.removeItem('searchResults');
    setPage(1);
    loadPublicRecords();
  };

  const handleRecordClick = (recordId: string) => {
    localStorage.setItem('fromSource', 'plaza');
    localStorage.setItem('plazaPage', page.toString());
    localStorage.setItem('plazaPageSize', pageSize.toString());
    localStorage.setItem('plazaSearched', searched.toString());
    localStorage.setItem('plazaQuery', query);
    navigate(`/records/${recordId}`);
  };

  const handleLike = async (e: React.MouseEvent, recordId: string) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }

    try {
      const record = publicRecords.find(r => r.id === recordId);
      if (!record) return;

      if (record.is_liked) {
        await likesApi.unlikeRecord(recordId);
        record.is_liked = false;
        record.like_count = Math.max(0, (record.like_count || 0) - 1);
      } else {
        await likesApi.likeRecord(recordId);
        record.is_liked = true;
        record.like_count = (record.like_count || 0) + 1;
      }
      setPublicRecords([...publicRecords]);
    } catch (error) {
      console.error('Failed to like/unlike record:', error);
      alert('操作失败，请重试');
    }
  };

  // 打开评论弹窗
  const handleOpenComments = (e: React.MouseEvent, record: Record) => {
    e.stopPropagation();
    setSelectedRecord(record);
    setCommentModalOpen(true);
  };

  // 关闭评论弹窗
  const handleCloseComments = () => {
    setCommentModalOpen(false);
    setSelectedRecord(null);
  };

  // 评论添加后的回调
  const handleCommentAdded = () => {
    if (selectedRecord) {
      // 更新评论数
      const updatedRecords = publicRecords.map(r => 
        r.id === selectedRecord.id 
          ? { ...r, comment_count: (r.comment_count || 0) + 1 }
          : r
      );
      setPublicRecords(updatedRecords);
    }
  };

  const handleExperienceClick = (experienceId: string) => {
    localStorage.setItem('fromSource', 'plaza');
    navigate(`/experiences/${experienceId}`);
  };

  const handleCollectionClick = (collection: Collection) => {
    localStorage.setItem('fromSource', 'plaza');
    navigate(`/collections/${collection.id}`);
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:text-gray-100">
      <div className="fixed top-16 left-0 right-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">美好广场</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">发现和分享美好的瞬间</p>
            </div>

            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-md p-3">
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="搜索美好、风采、收藏..."
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '搜索中...' : '搜索'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 pt-28">
        <div className="flex gap-6">
          {/* 主内容区 */}
          <div className="flex-1">
        {searched ? (
          <div className="space-y-8">
            {results.records.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  今日美好 ({results.records.length})
                </h2>
                <div className="space-y-3">
                  {results.records.map((record) => (
                    <div
                      key={record.id}
                      onClick={() => handleRecordClick(record.id)}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 flex-1">
                          {record.title || '无标题'}
                        </h3>
                        {record.user && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                            by {record.user.username}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-2">
                        {record.content}
                      </p>
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <button
                          onClick={(e) => handleLike(e, record.id)}
                          className={`flex items-center px-2 py-1 rounded-full transition-colors ${
                            record.is_liked 
                              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <span className="mr-1">{record.is_liked ? '❤️' : '🤍'}</span>
                          <span className="font-medium">{record.like_count || 0}</span>
                        </button>
                        <button
                          onClick={(e) => handleOpenComments(e, record)}
                          className="flex items-center px-2 py-1 rounded-full transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          <span className="mr-1">💬</span>
                          <span className="font-medium">{record.comment_count || 0}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {results.experiences.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  往日风采 ({results.experiences.length})
                </h2>
                <div className="space-y-3">
                  {results.experiences.map((exp) => (
                    <div
                      key={exp.id}
                      onClick={() => handleExperienceClick(exp.id)}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 flex-1">{exp.title}</h3>
                        {exp.user && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                            by {exp.user.username}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {results.collections.length > 0 && isAuthenticated && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  收藏 ({results.collections.length})
                </h2>
                <div className="space-y-3">
                  {results.collections.map((collection) => (
                    <div
                      key={collection.id}
                      onClick={() => handleCollectionClick(collection)}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{collection.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                        {collection.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {results.records.length === 0 &&
             results.experiences.length === 0 &&
             (results.collections.length === 0 || !isAuthenticated) && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                没有找到相关内容
              </div>
            )}
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : publicRecords.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-100 dark:border-gray-700">
                <div className="text-6xl mb-4">🌟</div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">广场上还没有内容，快来发布第一条今日美好吧！</p>
                {isAuthenticated && (
                  <button
                    onClick={() => navigate('/records')}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
                  >
                    去发布今日美好
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {publicRecords.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => handleRecordClick(record.id)}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                          {record.title || '无标题'}
                        </h2>
                        {record.user && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            by {record.user.username}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed text-lg">
                      {record.content}
                    </p>
                    
                    {/* 图片展示 */}
                    {record.image_urls && record.image_urls.length > 0 && (
                      <div className="mb-4">
                        <div className={`grid gap-2 ${
                          record.image_urls.length === 1 
                            ? 'grid-cols-1' 
                            : record.image_urls.length === 2 
                              ? 'grid-cols-2' 
                              : 'grid-cols-3'
                        }`}>
                          {record.image_urls.map((url, index) => (
                            <div 
                              key={index} 
                              className="relative aspect-video rounded-lg overflow-hidden bg-gray-100"
                            >
                              <img
                                src={url}
                                alt={`图片 ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
                          {record.record_type === 'note' ? '📝 笔记' : record.record_type === 'idea' ? '💡 想法' : '📅 日志'}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">📅</span>
                          {formatDateTime(record.published_at || record.created_at)}
                        </span>
                        <button
                          onClick={(e) => handleLike(e, record.id)}
                          className={`flex items-center px-2 py-1 rounded-full transition-colors ${
                            record.is_liked 
                              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <span className="mr-1">{record.is_liked ? '❤️' : '🤍'}</span>
                          <span className="font-medium">{record.like_count || 0}</span>
                        </button>
                        <button
                          onClick={(e) => handleOpenComments(e, record)}
                          className="flex items-center px-2 py-1 rounded-full transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          <span className="mr-1">💬</span>
                          <span className="font-medium">{record.comment_count || 0}</span>
                        </button>
                        {record.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex space-x-1">
                              {record.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-blue-600 dark:text-blue-400 font-medium">#{tag}</span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {total > 0 && (
              <div className="flex flex-col items-center mt-12 space-y-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md border border-gray-200 dark:border-gray-600 font-medium"
                  >
                    ← 上一页
                  </button>
                  <span className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl shadow-md border border-gray-200 dark:border-gray-600 font-medium">
                    第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * pageSize >= total}
                    className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md border border-gray-200 dark:border-gray-600 font-medium"
                  >
                    下一页 →
                  </button>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">每页显示：</span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10条</option>
                      <option value={20}>20条</option>
                      <option value={30}>30条</option>
                      <option value={50}>50条</option>
                      <option value={100}>100条</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">跳转到：</span>
                    <input
                      type="number"
                      value={jumpToPage}
                      onChange={(e) => setJumpToPage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      min={1}
                      max={Math.ceil(total / pageSize)}
                      className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="页码"
                    />
                    <button
                      onClick={handleJumpToPage}
                      disabled={!jumpToPage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      跳转
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
          </div>
          
          {/* 侧边栏 */}
          <div className="w-80 hidden lg:block">
            <div className="sticky top-28 space-y-6">
              <HotContent />
            </div>
          </div>
        </div>
      </div>
      
      {/* 评论弹窗 */}
      <CommentModal
        isOpen={commentModalOpen}
        onClose={handleCloseComments}
        recordId={selectedRecord?.id || ''}
        recordTitle={selectedRecord?.title}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};
