import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { LoginModal } from './LoginModal';
import { ThemeToggle } from '../ThemeToggle';
import { NotificationBell } from '../notifications/NotificationBell';
import { Logo } from '../brand/Logo';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
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
    setMobileMenuOpen(false);
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

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
              <Logo size="sm" animated={false} className="sm:hidden" />
              <Logo size="md" animated={false} className="hidden sm:block" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
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
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              
              {isAuthenticated ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <NotificationBell />
                  
                  {/* Desktop User Menu */}
                  <div className="relative group hidden sm:block">
                    <button className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors duration-200">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white text-xs sm:text-sm font-medium overflow-hidden">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          user?.username?.charAt(0)?.toUpperCase() || 'U'
                        )}
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)] hidden md:inline">
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

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {mobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLogin}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    登录
                  </button>
                  {/* Mobile Menu Button for non-authenticated users */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {mobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[var(--border-color)] bg-[var(--bg-card)] shadow-soft-lg">
            <nav className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                      isActive(item.path)
                        ? 'bg-terracotta-500 text-white'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Mobile User Section */}
              {isAuthenticated && (
                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                  <div className="flex items-center gap-3 px-4 py-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white font-medium overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        user?.username?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{user?.username}</p>
                      <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    个人中心
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 rounded-xl text-left text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
      
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
};
