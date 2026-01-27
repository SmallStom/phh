import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recordsApi } from '../api/records';
import { experiencesApi } from '../api/experiences';
import { collectionsApi } from '../api/collections';
import { useAuthStore } from '../store/authStore';
import type { Record } from '../types/record';
import type { Experience } from '../types/experience';
import type { Collection } from '../types/collection';

export const Search: React.FC = () => {
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const navigate = useNavigate();
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
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasRestored, setHasRestored] = useState(false);

  useEffect(() => {
    initializeAuth();
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!hasRestored && authChecked) {
      const savedQuery = localStorage.getItem('searchQuery');
      const savedResults = localStorage.getItem('searchResults');
      if (savedQuery && savedResults) {
        setQuery(savedQuery);
        setResults(JSON.parse(savedResults));
        setSearched(true);
        setHasRestored(true);
      }
    }
  }, [hasRestored, authChecked]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const [recordsRes, experiencesRes, collectionsRes] = await Promise.all([
        recordsApi.getRecords({ search: query, page_size: 10 }),
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRecordClick = (recordId: string) => {
    localStorage.setItem('fromSearch', 'true');
    navigate(`/records/${recordId}`);
  };

  const handleExperienceClick = (experienceId: string) => {
    localStorage.setItem('fromSearch', 'true');
    navigate(`/experiences/${experienceId}`);
  };

  const handleCollectionClick = (collection: Collection) => {
    localStorage.setItem('fromSearch', 'true');
    navigate(`/collections/${collection.id}`);
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">搜索</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex space-x-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="搜索美好、风采、收藏..."
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>
      </div>
      
      {searched && (
        <div className="space-y-8">
          {results.records.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                今日美好 ({results.records.length})
              </h2>
              <div className="space-y-3">
                {results.records.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => handleRecordClick(record.id)}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <h3 className="font-medium text-gray-900 mb-1">
                      {record.title || '无标题'}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {record.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {results.experiences.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                往日风采 ({results.experiences.length})
              </h2>
              <div className="space-y-3">
                {results.experiences.map((exp) => (
                  <div
                    key={exp.id}
                    onClick={() => handleExperienceClick(exp.id)}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <h3 className="font-medium text-gray-900 mb-1">{exp.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {results.collections.length > 0 && isAuthenticated && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                收藏 ({results.collections.length})
              </h2>
              <div className="space-y-3">
                {results.collections.map((collection) => (
                  <div
                    key={collection.id}
                    onClick={() => handleCollectionClick(collection)}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <h3 className="font-medium text-gray-900 mb-1">{collection.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
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
            <div className="text-center py-8 text-gray-500">
              没有找到相关内容
            </div>
          )}
        </div>
      )}
    </div>
  );
};
