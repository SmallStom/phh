import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../../store/uiStore';

export const Layout: React.FC = () => {
  const { sidebarOpen } = useUIStore();
  const location = useLocation();

  // 当路由变化时，重置滚动位置到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header />
      <div className="flex relative">
        <Sidebar />
        <main className={`flex-1 transition-all duration-300 pt-16 ${sidebarOpen ? 'ml-64' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
