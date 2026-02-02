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
    { path: '/', label: '广场', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    )},
  ];

  const privateMenuItems = [
    { path: '/records', label: '今日美好', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )},
    { path: '/experiences', label: '往日风采', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )},
    { path: '/collections', label: '收藏', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    )},
  ];

  const menuItems = isAuthenticated ? [...publicMenuItems, ...privateMenuItems] : publicMenuItems;

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] overflow-y-auto z-40 transition-all duration-300"
           style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* 装饰性顶部线条 */}
      <div className="h-1 w-full bg-gradient-to-r from-terracotta-400 via-forest-400 to-sand-400" />
      
      <nav className="p-4 space-y-1">
        {/* 导航标题 */}
        <div className="px-4 py-3 mb-4">
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            导航菜单
          </h3>
          <div className="decorative-line mt-2 w-12" />
        </div>
        
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? 'bg-terracotta-500 text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className={`transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              
              {/* 活跃指示器 */}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* 底部信息 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border-color)]"
           style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center space-y-2">
          <p className="text-xs text-[var(--text-muted)]">
            记录美好，分享生活
          </p>
          <p className="text-[10px] text-[var(--text-muted)]/60">
            蜀ICP备2026003667号-1
          </p>
        </div>
      </div>
    </aside>
  );
};
