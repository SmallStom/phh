import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { recordsApi } from '../../api/records';
import { experiencesApi } from '../../api/experiences';
import { collectionsApi } from '../../api/collections';
import { useAuthStore } from '../../store/authStore';
import { Search, X, Clock, TrendingUp, Filter, Tag } from 'lucide-react';
import type { Record } from '../../types/record';
import type { Experience } from '../../types/experience';
import type { Collection } from '../../types/collection';

interface SearchFilters {
  type: 'all' | 'record' | 'experience' | 'collection';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  sortBy: 'relevance' | 'newest' | 'oldest' | 'popular';
  tags: string[];
}

interface SearchSuggestion {
  id: string;
  type: 'history' | 'trending' | 'tag';
  text: string;
  count?: number;
}

interface SearchResults {
  records: Record[];
  experiences: Experience[];
  collections: Collection[];
}

const POPULAR_SEARCHES = ['旅行', '美食', '摄影', '读书', '生活感悟', '工作笔记'];

export const AdvancedSearch: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [, setResults] = useState<SearchResults>({
    records: [],
    experiences: [],
    collections: [],
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    dateRange: 'all',
    sortBy: 'relevance',
    tags: [],
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 加载搜索历史
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 更新建议
  useEffect(() => {
    if (!isOpen) return;

    const newSuggestions: SearchSuggestion[] = [];

    // 添加搜索历史
    if (query === '' && searchHistory.length > 0) {
      searchHistory.slice(0, 5).forEach((item, index) => {
        newSuggestions.push({
          id: `history-${index}`,
          type: 'history',
          text: item,
        });
      });
    }

    // 添加热门搜索
    if (query === '') {
      POPULAR_SEARCHES.forEach((item, index) => {
        newSuggestions.push({
          id: `trending-${index}`,
          type: 'trending',
          text: item,
        });
      });
    }

    setSuggestions(newSuggestions);
  }, [query, isOpen, searchHistory]);

  // 保存搜索历史
  const saveSearchHistory = useCallback((searchQuery: string) => {
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  }, [searchHistory]);

  // 删除搜索历史
  const removeFromHistory = (text: string) => {
    const newHistory = searchHistory.filter(h => h !== text);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // 执行搜索
  const executeSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    saveSearchHistory(searchQuery);

    try {
      const promises: Promise<any>[] = [];
      
      // 计算日期范围
      const now = new Date();
      let dateFrom: string | undefined;
      let dateTo: string | undefined;
      
      if (filters.dateRange === 'today') {
        dateFrom = now.toISOString().split('T')[0];
        dateTo = dateFrom;
      } else if (filters.dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFrom = weekAgo.toISOString().split('T')[0];
        dateTo = now.toISOString().split('T')[0];
      } else if (filters.dateRange === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        dateFrom = monthAgo.toISOString().split('T')[0];
        dateTo = now.toISOString().split('T')[0];
      } else if (filters.dateRange === 'year') {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        dateFrom = yearAgo.toISOString().split('T')[0];
        dateTo = now.toISOString().split('T')[0];
      }

      if (filters.type === 'all' || filters.type === 'record') {
        promises.push(recordsApi.getRecords({ 
          search: searchQuery, 
          page_size: 20,
          sort: filters.sortBy === 'relevance' ? 'newest' : filters.sortBy,
          date_from: dateFrom,
          date_to: dateTo,
        }));
      }
      if (filters.type === 'all' || filters.type === 'experience') {
        promises.push(experiencesApi.getExperiences({ 
          search: searchQuery,
          page_size: 20 
        }));
      }
      if ((filters.type === 'all' || filters.type === 'collection') && isAuthenticated) {
        promises.push(collectionsApi.getCollections({ search: searchQuery, page_size: 20 }));
      }

      const responses = await Promise.all(promises);
      
      const newResults: SearchResults = {
        records: [],
        experiences: [],
        collections: [],
      };

      let responseIndex = 0;
      if (filters.type === 'all' || filters.type === 'record') {
        newResults.records = responses[responseIndex]?.data || [];
        responseIndex++;
      }
      if (filters.type === 'all' || filters.type === 'experience') {
        newResults.experiences = responses[responseIndex]?.data || [];
        responseIndex++;
      }
      if ((filters.type === 'all' || filters.type === 'collection') && isAuthenticated) {
        newResults.collections = responses[responseIndex]?.data || [];
      }

      setResults(newResults);
      setIsOpen(false);
      
      // 导航到搜索结果页
      navigate('/search', { 
        state: { 
          query: searchQuery, 
          results: newResults,
          filters 
        } 
      });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    executeSearch(suggestion.text);
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'history':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'tag':
        return <Tag className="w-4 h-4 text-blue-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      {/* 搜索输入框 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="搜索美好、风采、收藏..."
          className="w-full pl-11 pr-20 py-3 bg-white border border-gray-200 rounded-xl shadow-sm 
                     focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent
                     transition-all duration-200"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
          {query && (
            <button
              onClick={clearSearch}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-terracotta-100 text-terracotta-600' : 'hover:bg-gray-100 text-gray-400'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeSearch()}
            disabled={loading || !query.trim()}
            className="px-4 py-1.5 bg-terracotta-600 text-white text-sm rounded-lg
                       hover:bg-terracotta-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                       transition-colors"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>
      </div>

      {/* 筛选器面板 */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-xl shadow-lg border border-gray-100 z-50"
          >
            <div className="space-y-4">
              {/* 类型筛选 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">内容类型</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: '全部' },
                    { value: 'record', label: '美好' },
                    { value: 'experience', label: '风采' },
                    { value: 'collection', label: '收藏' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters({ ...filters, type: option.value as any })}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        filters.type === option.value
                          ? 'bg-terracotta-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 时间范围 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">时间范围</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: '全部时间' },
                    { value: 'today', label: '今天' },
                    { value: 'week', label: '本周' },
                    { value: 'month', label: '本月' },
                    { value: 'year', label: '今年' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters({ ...filters, dateRange: option.value as any })}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        filters.dateRange === option.value
                          ? 'bg-terracotta-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 排序方式 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">排序方式</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'relevance', label: '相关度' },
                    { value: 'newest', label: '最新' },
                    { value: 'oldest', label: '最早' },
                    { value: 'popular', label: '热门' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters({ ...filters, sortBy: option.value as any })}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        filters.sortBy === option.value
                          ? 'bg-terracotta-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 搜索建议下拉框 */}
      <AnimatePresence>
        {isOpen && (query === '' || suggestions.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-40"
          >
            {suggestions.length > 0 ? (
              <div className="py-2">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      {getSuggestionIcon(suggestion.type)}
                      <span className="text-gray-700">{suggestion.text}</span>
                    </div>
                    {suggestion.type === 'history' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(suggestion.text);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : query !== '' ? (
              <div className="px-4 py-3 text-gray-500 text-sm">
                按 Enter 搜索 &quot;{query}&quot;
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
