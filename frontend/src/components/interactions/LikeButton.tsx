import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { likesApi } from '../../api/likes';
import { useAuthStore } from '../../store/authStore';

interface LikeButtonProps {
  targetId: string;
  initialLiked: boolean;
  initialCount: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  onLikeChange?: (liked: boolean, count: number) => void;
}

const sizeClasses = {
  sm: { button: 'p-1.5', icon: 'w-4 h-4', text: 'text-xs' },
  md: { button: 'p-2', icon: 'w-5 h-5', text: 'text-sm' },
  lg: { button: 'p-3', icon: 'w-6 h-6', text: 'text-base' },
};

export const LikeButton: React.FC<LikeButtonProps> = ({
  targetId,
  initialLiked,
  initialCount,
  size = 'md',
  showCount = true,
  onLikeChange,
}) => {
  const { isAuthenticated } = useAuthStore();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated) {
      // 可以触发登录弹窗
      return;
    }

    if (isAnimating) return;

    setIsAnimating(true);

    try {
      if (isLiked) {
        await likesApi.unlikeRecord(targetId);
        setIsLiked(false);
        setCount(prev => prev - 1);
        onLikeChange?.(false, count - 1);
      } else {
        await likesApi.likeRecord(targetId);
        setIsLiked(true);
        setCount(prev => prev + 1);
        onLikeChange?.(true, count + 1);
      }
    } catch (error) {
      console.error('Like action failed:', error);
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const classes = sizeClasses[size];

  return (
    <motion.button
      onClick={handleLike}
      disabled={isAnimating}
      className={`flex items-center gap-1.5 rounded-full transition-colors ${classes.button} ${
        isLiked
          ? 'text-red-500 hover:bg-red-50'
          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
      }`}
      whileTap={{ scale: 0.9 }}
    >
      <div className="relative">
        <AnimatePresence>
          {isLiked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute inset-0"
            >
              {/* 粒子效果 */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: [0, Math.cos((i * 60 * Math.PI) / 180) * 20],
                    y: [0, Math.sin((i * 60 * Math.PI) / 180) * 20],
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute top-1/2 left-1/2 w-1 h-1 bg-red-400 rounded-full"
                  style={{ marginLeft: '-2px', marginTop: '-2px' }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={isLiked ? {
            scale: [1, 1.3, 1],
            transition: { duration: 0.3 }
          } : {}}
        >
          <Heart
            className={`${classes.icon} transition-all ${
              isLiked ? 'fill-current' : ''
            }`}
          />
        </motion.div>
      </div>

      {showCount && (
        <motion.span
          key={count}
          initial={{ y: isLiked ? 10 : -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`${classes.text} font-medium`}
        >
          {count}
        </motion.span>
      )}
    </motion.button>
  );
};
