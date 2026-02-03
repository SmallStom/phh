import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LoginModal } from './LoginModal';
import { ThemeToggle } from '../ThemeToggle';
import { NotificationBell } from '../notifications/NotificationBell';
import { Logo } from '../brand/Logo';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const navItems = [
    { path: '/', label: '首页', icon: '✦' },
    { path: '/records', label: '美好', icon: '◆' },
    { path: '/experiences', label: '风采', icon: '●' },
    { path: '/collections', label: '收藏', icon: '◈' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'glass shadow-soft border-b border-[var(--border-color)]' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <Logo size="md" animated={false} />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive(item.path)
                      ? 'text-[var(--accent-color)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`text-xs transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : ''}`}>
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  {isActive(item.path) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent-color)]" />
                  )}
                </Link>
              ))}
            </nav>
            
            {/* Right Section */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <NotificationBell />
                  
                  {/* User Menu */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors duration-200">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white text-sm font-medium">
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)] hidden sm:inline">
                        {user?.username}
                      </span>
                    </button>
                    
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-soft-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="px-4 py-2 border-b border-[var(--border-color)]">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{user?.username}</p>
                        <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="block w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:text-[var(--accent-color)] hover:bg-[var(--bg-secondary)] transition-colors duration-200"
                      >
                        个人中心
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:text-[var(--accent-color)] hover:bg-[var(--bg-secondary)] transition-colors duration-200"
                      >
                        退出登录
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="btn-primary text-sm"
                >
                  登录
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
};
