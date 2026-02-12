import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../../store/uiStore';

export const Layout: React.FC = () => {
  const { sidebarOpen } = useUIStore();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header />
      <div className="flex relative">
        {/* Sidebar - hidden on mobile and tablet */}
        <div className="hidden xl:block">
          <Sidebar />
        </div>
        <main className={`flex-1 transition-all duration-300 pt-14 sm:pt-16 ${sidebarOpen ? 'xl:ml-64' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
