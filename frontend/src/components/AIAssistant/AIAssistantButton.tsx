import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import { AIAssistant } from './AIAssistant';
import { useAuthStore } from '../../store/authStore';

export const AIAssistantButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  // 未登录时不显示 AI 助手按钮
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed right-6 bottom-6 z-[9990] w-14 h-14 bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
          >
            <Bot className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* AI 助手窗口 */}
      <AIAssistant isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
