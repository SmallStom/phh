import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarOpen } = useUIStore();
  const { isAuthenticated } = useAuthStore();

  if (!sidebarOpen) return null;

  const publicMenuItems = [
    { path: '/', label: '广场', icon: '🌟' },
  ];

  const privateMenuItems = [
    { path: '/records', label: '今日美好', icon: '📝' },
    { path: '/experiences', label: '往日风采', icon: '📅' },
    { path: '/collections', label: '收藏', icon: '⭐' },
  ];

  const menuItems = isAuthenticated ? [...publicMenuItems, ...privateMenuItems] : publicMenuItems;

  return (
    <aside className="fixed left-0 top-16 w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 h-[calc(100vh-4rem)] overflow-y-auto shadow-lg z-40 transition-colors duration-200">
      <nav className="p-6 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${
              location.pathname === item.path
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 text-blue-700 dark:text-blue-300 shadow-md border border-blue-200 dark:border-blue-700'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">蜀ICP备2026003667号-1</p>
      </div>
    </aside>
  );
};
