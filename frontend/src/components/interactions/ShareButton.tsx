import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Link2, Twitter, MessageCircle, X, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  url: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: { button: 'p-1.5', icon: 'w-4 h-4' },
  md: { button: 'p-2', icon: 'w-5 h-5' },
  lg: { button: 'p-3', icon: 'w-6 h-6' },
};

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  url,
  description = '',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const classes = sizeClasses[size];

  const shareOptions = [
    {
      name: '复制链接',
      icon: Link2,
      action: async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      },
      color: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      action: () => {
        const text = encodeURIComponent(`${title} ${url}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
      },
      color: 'bg-sky-100 hover:bg-sky-200 text-sky-600',
    },
    {
      name: '微信',
      icon: MessageCircle,
      action: () => {
        // 微信分享需要特殊处理，这里只是示例
        alert('请使用微信扫一扫分享');
      },
      color: 'bg-green-100 hover:bg-green-200 text-green-600',
    },
  ];

  // 使用 Web Share API（如果可用）
  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        // 用户取消分享，打开自定义分享弹窗
        setIsOpen(true);
      }
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      <motion.button
        onClick={handleNativeShare}
        className={`flex items-center gap-1.5 rounded-full text-gray-400 hover:text-terracotta-600 hover:bg-terracotta-50 transition-colors ${classes.button}`}
        whileTap={{ scale: 0.9 }}
      >
        <Share2 className={classes.icon} />
      </motion.button>

      {/* 分享弹窗 */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setIsOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 头部 */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">分享到</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* 分享选项 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {shareOptions.map((option) => (
                    <motion.button
                      key={option.name}
                      onClick={option.action}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${option.color}`}>
                        {option.name === '复制链接' && copied ? (
                          <Check className="w-6 h-6 text-green-600" />
                        ) : (
                          <option.icon className="w-6 h-6" />
                        )}
                      </div>
                      <span className="text-sm text-gray-600">
                        {option.name === '复制链接' && copied ? '已复制' : option.name}
                      </span>
                    </motion.button>
                  ))}
                </div>

                {/* 链接预览 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-2">链接预览</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                      <p className="text-xs text-gray-400 truncate">{url}</p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(url);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch (err) {
                          console.error('Failed to copy:', err);
                        }
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Link2 className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
