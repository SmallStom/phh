import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../../store/uiStore';

export const Layout: React.FC = () => {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <Header />
      <div className="flex relative pt-16">
        <Sidebar />
        <main className={`flex-1 p-6 transition-all ${sidebarOpen ? 'ml-64' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
