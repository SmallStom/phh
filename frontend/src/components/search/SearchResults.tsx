import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, BookOpen, FolderOpen, Heart, MessageCircle, Calendar, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Record } from '../../types/record';
import type { Experience } from '../../types/experience';
import type { Collection } from '../../types/collection';

interface SearchResultsProps {
  query: string;
  results: {
    records: Record[];
    experiences: Experience[];
    collections: Collection[];
  };
  filters: {
    type: string;
    sortBy: string;
  };
}

const typeConfig = {
  note: { icon: '✦', label: '笔记', color: 'bg-forest-100 text-forest-700' },
  idea: { icon: '◆', label: '想法', color: 'bg-terracotta-100 text-terracotta-700' },
  log: { icon: '●', label: '日志', color: 'bg-sand-200 text-sand-800' },
};

export const SearchResults: React.FC<SearchResultsProps> = ({ query, results }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'record' | 'experience' | 'collection'>('all');

  const totalCount = results.records.length + results.experiences.length + results.collections.length;

  const getFilteredResults = () => {
    if (activeTab === 'all') return results;
    return {
      records: activeTab === 'record' ? results.records : [],
      experiences: activeTab === 'experience' ? results.experiences : [],
      collections: activeTab === 'collection' ? results.collections : [],
    };
  };

  const filteredResults = getFilteredResults();

  const tabs = [
    { id: 'all', label: '全部', count: totalCount },
    { id: 'record', label: '美好', count: results.records.length },
    { id: 'experience', label: '风采', count: results.experiences.length },
    { id: 'collection', label: '收藏', count: results.collections.length },
  ];

  const handleRecordClick = (recordId: string) => {
    navigate(`/records/${recordId}`);
  };

  const handleExperienceClick = (experienceId: string) => {
    navigate(`/experiences/${experienceId}`);
  };

  const handleCollectionClick = (collectionId: string) => {
    navigate(`/collections/${collectionId}`);
  };

  return (
    <div className="space-y-6">
      {/* 搜索结果标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          &quot;{query}&quot; 的搜索结果
          <span className="ml-2 text-sm text-gray-500">({totalCount})</span>
        </h2>
      </div>

      {/* 标签页 */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-terracotta-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === tab.id ? 'bg-terracotta-100' : 'bg-gray-200'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 结果列表 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-4"
        >
          {/* 美好记录 */}
          {filteredResults.records.length > 0 && (
            <section>
              {(activeTab === 'all') && (
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  美好 ({filteredResults.records.length})
                </h3>
              )}
              <div className="space-y-3">
                {filteredResults.records.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleRecordClick(record.id)}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md 
                               hover:border-terracotta-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            typeConfig[record.record_type]?.color || 'bg-gray-100'
                          }`}>
                            {typeConfig[record.record_type]?.icon} {typeConfig[record.record_type]?.label}
                          </span>
                          {record.is_public && (
                            <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full">
                              公开
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2 group-hover:text-terracotta-600 transition-colors">
                          {record.title || '无标题'}
                        </h4>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {record.content}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1" />
                            {formatDistanceToNow(new Date(record.created_at), { addSuffix: true, locale: zhCN })}
                          </span>
                          <span className="flex items-center">
                            <Heart className="w-3.5 h-3.5 mr-1" />
                            {record.like_count}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="w-3.5 h-3.5 mr-1" />
                            {record.comment_count}
                          </span>
                        </div>
                        {record.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {record.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {record.image_urls && record.image_urls.length > 0 && (
                        <div className="ml-4 flex-shrink-0">
                          <img
                            src={record.image_urls[0]}
                            alt=""
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* 往日风采 */}
          {filteredResults.experiences.length > 0 && (
            <section>
              {(activeTab === 'all') && (
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  往日风采 ({filteredResults.experiences.length})
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredResults.experiences.map((exp, index) => (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleExperienceClick(exp.id)}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md 
                               hover:border-terracotta-200 transition-all cursor-pointer group"
                  >
                    <h4 className="font-medium text-gray-900 mb-2 group-hover:text-terracotta-600 transition-colors">
                      {exp.title}
                    </h4>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {exp.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {formatDistanceToNow(new Date(exp.created_at), { addSuffix: true, locale: zhCN })}
                      </span>
                      <span className="flex items-center">
                        <FolderOpen className="w-3.5 h-3.5 mr-1" />
                        {exp.record_count} 条记录
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* 收藏 */}
          {filteredResults.collections.length > 0 && (
            <section>
              {(activeTab === 'all') && (
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  收藏 ({filteredResults.collections.length})
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResults.collections.map((collection, index) => (
                  <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleCollectionClick(collection.id)}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md 
                               hover:border-terracotta-200 transition-all cursor-pointer group"
                  >
                    <h4 className="font-medium text-gray-900 mb-2 group-hover:text-terracotta-600 transition-colors">
                      {collection.title}
                    </h4>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {collection.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span className="flex items-center">
                        <Tag className="w-3.5 h-3.5 mr-1" />
                        {collection.record_count} 条记录
                      </span>
                      <span>{collection.is_public ? '公开' : '私密'}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* 空状态 */}
          {totalCount === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相关内容</h3>
              <p className="text-gray-500">尝试使用其他关键词或调整筛选条件</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
