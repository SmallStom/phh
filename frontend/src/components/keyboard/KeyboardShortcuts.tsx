import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Command, X, Search, Plus, Home, User, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
  icon?: React.ReactNode;
}

export const KeyboardShortcuts: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [showHelp, setShowHelp] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);

  const shortcuts: Shortcut[] = [
    {
      key: 'k',
      ctrl: true,
      description: '打开搜索',
      action: () => navigate('/search'),
      icon: <Search className="w-4 h-4" />,
    },
    {
      key: 'h',
      ctrl: true,
      description: '回到首页',
      action: () => navigate('/'),
      icon: <Home className="w-4 h-4" />,
    },
    {
      key: 'p',
      ctrl: true,
      description: '个人中心',
      action: () => isAuthenticated && navigate('/profile'),
      icon: <User className="w-4 h-4" />,
    },
    {
      key: 'n',
      ctrl: true,
      description: '新建记录',
      action: () => isAuthenticated && navigate('/records/new'),
      icon: <Plus className="w-4 h-4" />,
    },
    {
      key: 'e',
      ctrl: true,
      description: '新建风采',
      action: () => isAuthenticated && navigate('/experiences/new'),
      icon: <Plus className="w-4 h-4" />,
    },
    {
      key: 'b',
      ctrl: true,
      description: '通知中心',
      action: () => {},
      icon: <Bell className="w-4 h-4" />,
    },
    {
      key: '?',
      shift: true,
      description: '显示快捷键帮助',
      action: () => setShowHelp(true),
      icon: <Command className="w-4 h-4" />,
    },
    {
      key: 'Escape',
      description: '关闭弹窗/返回',
      action: () => setShowHelp(false),
      icon: <X className="w-4 h-4" />,
    },
  ];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 忽略在输入框中的快捷键
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      if (e.key !== 'Escape') return;
    }

    const key = e.key.toLowerCase();
    
    // 显示快捷键帮助
    if (e.shiftKey && e.key === '?') {
      e.preventDefault();
      setShowHelp(true);
      return;
    }

    // 关闭帮助
    if (e.key === 'Escape' && showHelp) {
      e.preventDefault();
      setShowHelp(false);
      return;
    }

    // 匹配快捷键
    shortcuts.forEach((shortcut) => {
      const shortcutKey = shortcut.key.toLowerCase();
      const matchesKey = key === shortcutKey;
      const matchesCtrl = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const matchesAlt = shortcut.alt ? e.altKey : !e.altKey;
      const matchesShift = shortcut.shift ? e.shiftKey : !e.shiftKey;

      if (matchesKey && matchesCtrl && matchesAlt && matchesShift) {
        e.preventDefault();
        shortcut.action();
      }
    });

    // 记录按键用于显示
    const keyCombo: string[] = [];
    if (e.ctrlKey || e.metaKey) keyCombo.push('Ctrl');
    if (e.altKey) keyCombo.push('Alt');
    if (e.shiftKey) keyCombo.push('Shift');
    if (e.key.length === 1) keyCombo.push(e.key.toUpperCase());
    else if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
      keyCombo.push(e.key);
    }
    
    if (keyCombo.length > 0) {
      setPressedKeys(keyCombo);
      setTimeout(() => setPressedKeys([]), 1000);
    }
  }, [shortcuts, showHelp, navigate, isAuthenticated]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* 按键提示 */}
      <AnimatePresence>
        {pressedKeys.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/90 backdrop-blur-sm rounded-lg">
              {pressedKeys.map((key, index) => (
                <React.Fragment key={key}>
                  <kbd className="px-2 py-1 bg-gray-700 text-white text-sm font-mono rounded">
                    {key}
                  </kbd>
                  {index < pressedKeys.length - 1 && (
                    <span className="text-gray-400">+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快捷键帮助弹窗 */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-terracotta-100 rounded-lg">
                    <Command className="w-5 h-5 text-terracotta-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">键盘快捷键</h2>
                    <p className="text-sm text-gray-500">使用快捷键提高效率</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* 快捷键列表 */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-3">
                  {shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {shortcut.icon && (
                          <div className="text-gray-400">{shortcut.icon}</div>
                        )}
                        <span className="text-gray-700">{shortcut.description}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {shortcut.ctrl && (
                          <kbd className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded">
                            Ctrl
                          </kbd>
                        )}
                        {shortcut.alt && (
                          <kbd className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded">
                            Alt
                          </kbd>
                        )}
                        {shortcut.shift && (
                          <kbd className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded">
                            Shift
                          </kbd>
                        )}
                        <kbd className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded">
                          {shortcut.key}
                        </kbd>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 底部提示 */}
              <div className="p-4 bg-gray-50 border-t">
                <p className="text-sm text-gray-500 text-center">
                  按 <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">?</kbd> 随时打开此帮助
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
