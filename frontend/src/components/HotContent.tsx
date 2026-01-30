import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../api/analytics';
import toast from 'react-hot-toast';

type ContentType = 'records' | 'experiences' | 'collections' | 'users';

interface HotItem {
  id: string;
  score: number;
  title?: string;
  author?: string;
  is_public?: boolean;
  username?: string;
  followers_count?: number;
}

export const HotContent: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContentType>('records');
  const [items, setItems] = useState<HotItem[]>([]);
  const [loading, setLoading] = useState(false);

  const tabs: { key: ContentType; label: string }[] = [
    { key: 'records', label: '热门记录' },
    { key: 'experiences', label: '热门经历' },
    { key: 'collections', label: '热门收藏' },
    { key: 'users', label: '热门用户' },
  ];

  useEffect(() => {
    loadHotContent();
  }, [activeTab]);

  const loadHotContent = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeTab) {
        case 'records':
          response = await analyticsApi.getHotRecords(10);
          break;
        case 'experiences':
          response = await analyticsApi.getHotExperiences(10);
          break;
        case 'collections':
          response = await analyticsApi.getHotCollections(10);
          break;
        case 'users':
          response = await analyticsApi.getHotUsers(10);
          break;
      }
      // response 已经是 HotListResponse 类型，它包含 data 字段（HotItem[]）
      setItems(response.data || []);
    } catch (error) {
      console.error('Failed to load hot content:', error);
      toast.error('加载热门内容失败');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: HotItem) => {
    if (activeTab === 'users') {
      // navigate(`/users/${item.id}`);
      toast('用户主页功能开发中...');
    } else {
      navigate(`/${activeTab.slice(0, -1)}/${item.id}`);
    }
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (index === 1) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    if (index === 2) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
        </svg>
        热门排行
      </h2>

      {/* 标签页 */}
      <div className="flex space-x-2 mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容列表 */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          暂无数据
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
            >
              {/* 排名 */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${getRankStyle(
                  index
                )}`}
              >
                {index + 1}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                {activeTab === 'users' ? (
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-medium mr-3">
                      {item.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {item.username}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.followers_count} 粉丝 · 热度 {item.score}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                      {item.title || '无标题'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.author && `by ${item.author} · `}热度 {item.score}
                    </p>
                  </div>
                )}
              </div>

              {/* 箭头 */}
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
