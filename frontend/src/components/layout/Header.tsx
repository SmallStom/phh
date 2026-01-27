import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { LoginModal } from './LoginModal';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              PHH
            </Link>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-gray-700 font-medium flex items-center">
                    <span className="mr-2">👤</span>
                    {user?.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all font-medium"
                  >
                    退出
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
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
