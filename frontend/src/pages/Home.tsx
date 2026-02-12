import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { recordsApi } from '../api/records';
import { experiencesApi } from '../api/experiences';
import { collectionsApi } from '../api/collections';
import { likesApi } from '../api/likes';
import { useAuthStore } from '../store/authStore';
import { formatDateTime } from '../utils/dateUtils';
import { HotContent } from '../components/HotContent';
import { DailyGuessCard } from '../components/games/dailyGuess';
import CommentModal from '../components/CommentModal';
import { RecordCardSkeleton } from '../components/ui/Skeleton';
import { EmptyPlaza, EmptySearch } from '../components/feedback/EmptyState';
import { LoadingSpinner, LoadingDots } from '../components/feedback/LoadingState';
import { StaggerContainer, StaggerItem, HoverCard } from '../components/animation/PageTransition';
import { HtmlContent } from '../components/HtmlContent';
import type { Record as UserRecord } from '../types/record';
import type { Experience } from '../types/experience';
import type { Collection } from '../types/collection';

const typeIcons: Record<string, { icon: string; label: string; color: string }> = {
  note: { icon: '✦', label: '笔记', color: 'bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-300' },
  idea: { icon: '◆', label: '想法', color: 'bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/30 dark:text-terracotta-300' },
  log: { icon: '●', label: '日志', color: 'bg-sand-200 text-sand-800 dark:bg-sand-800 dark:text-sand-200' },
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [publicRecords, setPublicRecords] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [jumpToPage, setJumpToPage] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ records: UserRecord[]; experiences: Experience[]; collections: Collection[] }>({
    records: [], experiences: [], collections: [],
  });
  const [searched, setSearched] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<UserRecord | null>(null);

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('page')) setPage(parseInt(params.get('page')!));
    if (params.get('pageSize')) setPageSize(parseInt(params.get('pageSize')!));
    if (params.get('searched') === 'true') setSearched(true);
  }, [location.key]);

  useEffect(() => {
    initializeAuth();
    setAuthChecked(true);
  }, []);

  // 恢复滚动位置 - 在数据加载完成后执行
  useEffect(() => {
    if (!loading && publicRecords.length > 0) {
      const savedScrollY = localStorage.getItem('plazaScrollY');
      if (savedScrollY) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedScrollY));
          localStorage.removeItem('plazaScrollY');
        });
      }
    }
  }, [loading, publicRecords]);

  // 保存滚动位置
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('plazaScrollY', window.scrollY.toString());
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!searched) loadPublicRecords();
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

  const handlePageSizeChange = (newSize: number) => { setPageSize(newSize); setPage(1); };

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    if (pageNum && pageNum > 0) {
      setPage(Math.min(pageNum, Math.ceil(total / pageSize)));
      setJumpToPage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter') jumpToPage ? handleJumpToPage() : handleSearch(); };

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
      const searchResults = { records: recordsRes.data, experiences: experiencesRes.data, collections: collectionsRes.data };
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
    localStorage.setItem('plazaScrollY', window.scrollY.toString());
    navigate(`/records/${recordId}`);
  };

  const handleLike = async (e: React.MouseEvent, recordId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) { alert('请先登录'); return; }
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

  const handleSearchResultLike = async (record: UserRecord) => {
    if (!isAuthenticated) { alert('请先登录'); return; }
    try {
      if (record.is_liked) {
        await likesApi.unlikeRecord(record.id);
        record.is_liked = false;
        record.like_count = Math.max(0, (record.like_count || 0) - 1);
      } else {
        await likesApi.likeRecord(record.id);
        record.is_liked = true;
        record.like_count = (record.like_count || 0) + 1;
      }
      // 更新 results 中的记录
      setResults(prev => ({
        ...prev,
        records: prev.records.map(r => r.id === record.id ? { ...record } : r)
      }));
    } catch (error) {
      console.error('Failed to like/unlike record:', error);
      alert('操作失败，请重试');
    }
  };

  const handleOpenComments = (e: React.MouseEvent | UserRecord, record?: UserRecord) => {
    if ('stopPropagation' in e) {
      // 来自 ContentList 的调用方式
      e.stopPropagation();
      setSelectedRecord(record!);
    } else {
      // 来自 SearchResults 的调用方式，直接传入 record
      setSelectedRecord(e);
    }
    setCommentModalOpen(true);
  };

  const handleCloseComments = () => { setCommentModalOpen(false); setSelectedRecord(null); };

  const handleCommentAdded = () => {
    if (selectedRecord) {
      setPublicRecords(publicRecords.map(r => r.id === selectedRecord.id ? { ...r, comment_count: (r.comment_count || 0) + 1 } : r));
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
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative pt-20 sm:pt-24 pb-6 sm:pb-8 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="heading-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--text-primary)] mb-3 sm:mb-4 animate-fade-in">
            美好广场
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] mb-2 heading-hand text-xl sm:text-2xl animate-fade-in animation-delay-100">
            发现和分享美好的瞬间
          </p>
          <div className="decorative-line mx-auto mt-4 sm:mt-6 animate-fade-in animation-delay-200" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-12 sm:pb-16">
        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-200 outline-none pr-10 text-sm sm:text-base"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                placeholder="搜索美好、风采、收藏..."
              />
              {query && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="btn-primary whitespace-nowrap disabled:opacity-50 h-[38px] sm:h-[42px] flex items-center justify-center px-4 sm:px-6 text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <LoadingDots size="sm" />
                  <span className="hidden sm:inline">搜索中</span>
                </span>
              ) : '搜索'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-6 lg:gap-8">
          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {searched ? (
              <SearchResults
                results={results}
                isAuthenticated={isAuthenticated}
                onRecordClick={handleRecordClick}
                onExperienceClick={handleExperienceClick}
                onCollectionClick={handleCollectionClick}
                onOpenComments={handleOpenComments}
                onLike={handleSearchResultLike}
                query={query}
                onClearSearch={handleClearSearch}
              />
            ) : (
              <ContentList
                loading={loading}
                publicRecords={publicRecords}
                total={total}
                page={page}
                pageSize={pageSize}
                jumpToPage={jumpToPage}
                isAuthenticated={isAuthenticated}
                onRecordClick={handleRecordClick}
                onUserClick={(userId) => navigate(`/users/${userId}`)}
                onLike={handleLike}
                onOpenComments={handleOpenComments}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                onJumpToPage={setJumpToPage}
                onJumpToPageSubmit={handleJumpToPage}
                onKeyPress={handleKeyPress}
              />
            )}
          </div>

          {/* Sidebar - hidden on mobile and tablet */}
          <div className="w-72 lg:w-80 hidden xl:block flex-shrink-0 space-y-6">
            <div className="sticky top-20 space-y-6">
              <DailyGuessCard />
              <HotContent />
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Comment Modal */}
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

// Search Results Component
interface SearchResultsProps {
  results: { records: UserRecord[]; experiences: Experience[]; collections: Collection[] };
  isAuthenticated: boolean;
  onRecordClick: (id: string) => void;
  onExperienceClick: (id: string) => void;
  onCollectionClick: (collection: Collection) => void;
  onOpenComments?: (record: UserRecord) => void;
  onLike?: (record: UserRecord) => void;
  query?: string;
  onClearSearch?: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results, isAuthenticated, onRecordClick, onExperienceClick, onCollectionClick, onOpenComments, onLike, query, onClearSearch: handleClearSearch
}) => (
  <div className="space-y-8">
    {results.records.length > 0 && (
      <section className="animate-slide-up">
        <h2 className="heading-display text-2xl text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <span className="text-terracotta-500">✦</span>
          今日美好 <span className="text-sm font-normal text-[var(--text-muted)]">({results.records.length})</span>
        </h2>
        <div className="space-y-4">
          {results.records.map((record) => (
            <div
              key={record.id}
              onClick={() => onRecordClick(record.id)}
              className="card card-hover p-5 cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-lg text-[var(--text-primary)] mb-2">{record.title || '无标题'}</h3>
                  <HtmlContent content={record.content} lineClamp={3} className="text-sm" />
                </div>
              </div>

              {/* Images */}
              {record.image_urls && record.image_urls.length > 0 && (
                <div className={`grid gap-2 mb-3 ${
                  record.image_urls.length === 1 ? 'grid-cols-1' :
                  record.image_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                }`}>
                  {record.image_urls.slice(0, 3).map((url, idx) => (
                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
                      <img
                        src={url}
                        alt={`图片 ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  {record.user && (
                    <span className="flex items-center gap-1">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white text-xs">
                        {record.user.username.charAt(0).toUpperCase()}
                      </span>
                      {record.user.username}
                    </span>
                  )}
                  <span>•</span>
                  <span>{new Date(record.created_at).toLocaleDateString()}</span>
                  {record.record_type && (
                    <span className="px-2 py-0.5 bg-[var(--bg-secondary)] rounded text-[var(--text-secondary)]">
                      {record.record_type}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLike?.(record);
                    }}
                    className={`flex items-center gap-1 transition-colors ${
                      record.is_liked
                        ? 'text-terracotta-500'
                        : 'text-[var(--text-muted)] hover:text-terracotta-500'
                    }`}
                    disabled={!isAuthenticated}
                    title={isAuthenticated ? (record.is_liked ? '取消点赞' : '点赞') : '请先登录'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${record.is_liked ? 'fill-current' : ''}`} />
                    {record.like_count || 0}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenComments?.(record);
                    }}
                    className="flex items-center gap-1 text-[var(--text-muted)] hover:text-terracotta-500 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {record.comment_count || 0}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )}

    {results.experiences.length > 0 && (
      <section className="animate-slide-up animation-delay-100">
        <h2 className="heading-display text-2xl text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <span className="text-forest-500">◆</span>
          往日风采 <span className="text-sm font-normal text-[var(--text-muted)]">({results.experiences.length})</span>
        </h2>
        <div className="space-y-4">
          {results.experiences.map((exp) => (
            <div
              key={exp.id}
              onClick={() => onExperienceClick(exp.id)}
              className="card card-hover p-5 cursor-pointer"
            >
              <h3 className="font-medium text-[var(--text-primary)] mb-1">{exp.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm line-clamp-2">{exp.description}</p>
            </div>
          ))}
        </div>
      </section>
    )}

    {results.collections.length > 0 && isAuthenticated && (
      <section className="animate-slide-up animation-delay-200">
        <h2 className="heading-display text-2xl text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <span className="text-sand-600">◈</span>
          收藏 <span className="text-sm font-normal text-[var(--text-muted)]">({results.collections.length})</span>
        </h2>
        <div className="space-y-4">
          {results.collections.map((collection) => (
            <div
              key={collection.id}
              onClick={() => onCollectionClick(collection)}
              className="card card-hover p-5 cursor-pointer"
            >
              <h3 className="font-medium text-[var(--text-primary)] mb-1">{collection.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm line-clamp-2">{collection.description}</p>
            </div>
          ))}
        </div>
      </section>
    )}

    {results.records.length === 0 && results.experiences.length === 0 && (results.collections.length === 0 || !isAuthenticated) && (
      <EmptySearch query={query} onClear={handleClearSearch} />
    )}
  </div>
);

// Content List Component
interface ContentListProps {
  loading: boolean;
  publicRecords: UserRecord[];
  total: number;
  page: number;
  pageSize: number;
  jumpToPage: string;
  isAuthenticated: boolean;
  onRecordClick: (id: string) => void;
  onUserClick: (userId: string) => void;
  onLike: (e: React.MouseEvent, id: string) => void;
  onOpenComments: (e: React.MouseEvent, record: UserRecord) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onJumpToPage: (value: string) => void;
  onJumpToPageSubmit: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

const ContentList: React.FC<ContentListProps> = ({
  loading, publicRecords, total, page, pageSize, jumpToPage,
  onRecordClick, onUserClick, onLike, onOpenComments, onPageChange, onPageSizeChange,
  onJumpToPage, onJumpToPageSubmit, onKeyPress
}) => {

  if (loading) {
    return (
      <StaggerContainer className="space-y-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <StaggerItem key={index}>
            <RecordCardSkeleton />
          </StaggerItem>
        ))}
      </StaggerContainer>
    );
  }

  if (publicRecords.length === 0) {
    return (
      <EmptyPlaza />
    );
  }

  return (
    <StaggerContainer className="space-y-4 sm:space-y-6">
      {publicRecords.map((record) => {
        const typeInfo = typeIcons[record.record_type] || typeIcons.note;
        return (
          <StaggerItem key={record.id}>
            <HoverCard>
              <article
                onClick={() => onRecordClick(record.id)}
                className="card card-hover p-4 sm:p-6 cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <h2 className="heading-display text-lg sm:text-xl md:text-2xl text-[var(--text-primary)] mb-1.5 sm:mb-2 hover:text-[var(--accent-color)] transition-colors truncate">
                  {record.title || '无标题'}
                </h2>
                {record.user && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[var(--text-muted)]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUserClick(record.user!.id);
                      }}
                      className="flex items-center gap-1.5 sm:gap-2 hover:text-[var(--accent-color)] transition-colors"
                    >
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white text-[10px] sm:text-xs overflow-hidden flex-shrink-0">
                        {record.user.avatar ? (
                          <img src={record.user.avatar} alt={record.user.username} className="w-full h-full object-cover" />
                        ) : (
                          record.user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="truncate">{record.user.username}</span>
                    </button>
                    <span>•</span>
                    <span className="hidden sm:inline">{formatDateTime(record.published_at || record.created_at)}</span>
                    <span className="sm:hidden">{new Date(record.published_at || record.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ${typeInfo.color}`}>
                <span className="mr-0.5 sm:mr-1">{typeInfo.icon}</span>
                {typeInfo.label}
              </span>
            </div>

            {/* Content */}
            <HtmlContent content={record.content} lineClamp={3} className="mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base" />

            {/* Images */}
            {record.image_urls && record.image_urls.length > 0 && (
              <div className={`grid gap-1.5 sm:gap-2 mb-3 sm:mb-4 ${
                record.image_urls.length === 1 ? 'grid-cols-1' : 
                record.image_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
              }`}>
                {record.image_urls.slice(0, 3).map((url, idx) => (
                  <div key={idx} className="relative aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-[var(--bg-secondary)]">
                    <img
                      src={url}
                      alt={`图片 ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-[var(--border-color)]">
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={(e) => onLike(e, record.id)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm transition-all ${
                    record.is_liked
                      ? 'bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/30 dark:text-terracotta-300'
                      : 'hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                  }`}
                >
                  <span>{record.is_liked ? '♥' : '♡'}</span>
                  <span>{record.like_count || 0}</span>
                </button>
                <button
                  onClick={(e) => onOpenComments(e, record)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-all"
                >
                  <span>✉</span>
                  <span>{record.comment_count || 0}</span>
                </button>
              </div>
              {record.tags.length > 0 && (
                <div className="flex gap-1 sm:gap-2 overflow-x-auto">
                  {record.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="tag text-[10px] sm:text-xs whitespace-nowrap">#{tag}</span>
                  ))}
                  {record.tags.length > 2 && (
                    <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">+{record.tags.length - 2}</span>
                  )}
                </div>
              )}
                </div>
              </article>
            </HoverCard>
          </StaggerItem>
        );
      })}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col items-center gap-4 pt-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50"
            >
              ← 上一页
            </button>
            <span className="px-4 py-2 text-[var(--text-secondary)]">
              第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page * pageSize >= total}
              className="btn-secondary disabled:opacity-50"
            >
              下一页 →
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">每页显示：</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                className="input-field py-1.5 w-20"
              >
                {[10, 20, 30, 50, 100].map((size) => (
                  <option key={size} value={size}>{size}条</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">跳转到：</span>
              <input
                type="number"
                value={jumpToPage}
                onChange={(e) => onJumpToPage(e.target.value)}
                onKeyPress={onKeyPress}
                min={1}
                max={Math.ceil(total / pageSize)}
                className="input-field py-1.5 w-20 text-center"
                placeholder="页码"
              />
              <button
                onClick={onJumpToPageSubmit}
                disabled={!jumpToPage}
                className="btn-primary py-1.5 px-4 text-sm disabled:opacity-50"
              >
                跳转
              </button>
            </div>
          </div>
        </div>
      )}
    </StaggerContainer>
  );
};