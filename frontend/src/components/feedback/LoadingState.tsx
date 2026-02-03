import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

// 加载旋转器
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'var(--accent-color)',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <motion.div
      className={`${sizeMap[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-full h-full"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="31.416"
          strokeDashoffset="10"
          style={{ color }}
        />
      </svg>
    </motion.div>
  );
};

// 点状加载动画
interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  color = 'var(--accent-color)',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const dotVariants = {
    initial: { scale: 0.5, opacity: 0.3 },
    animate: {
      scale: [0.5, 1, 0.5],
      opacity: [0.3, 1, 0.3],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  return (
    <motion.div
      className={`flex items-center gap-1.5 ${className}`}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizeMap[size]} rounded-full`}
          style={{ backgroundColor: color }}
          variants={dotVariants}
        />
      ))}
    </motion.div>
  );
};

// 脉冲加载动画
interface LoadingPulseProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const LoadingPulse: React.FC<LoadingPulseProps> = ({
  size = 'md',
  color = 'var(--accent-color)',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`${sizeMap[size]} rounded-full`}
        style={{ backgroundColor: color, opacity: 0.3 }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <div
        className={`absolute inset-0 ${sizeMap[size]} rounded-full`}
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

// 全屏加载遮罩
interface FullscreenLoaderProps {
  visible: boolean;
  message?: string;
  blur?: boolean;
}

export const FullscreenLoader: React.FC<FullscreenLoaderProps> = ({
  visible,
  message = '加载中...',
  blur = true,
}) => {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${
        blur ? 'backdrop-blur-sm' : ''
      }`}
      style={{ backgroundColor: 'rgba(var(--bg-primary), 0.8)' }}
    >
      <LoadingPulse size="lg" />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-[var(--text-secondary)] text-sm"
      >
        {message}
      </motion.p>
    </motion.div>
  );
};

// 局部加载遮罩
interface LocalLoaderProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  minHeight?: string;
}

export const LocalLoader: React.FC<LocalLoaderProps> = ({
  loading,
  children,
  className = '',
  minHeight = '200px',
}) => {
  return (
    <div className={`relative ${className}`} style={{ minHeight }}>
      {children}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: 'rgba(var(--bg-primary), 0.7)' }}
        >
          <LoadingSpinner size="lg" />
        </motion.div>
      )}
    </div>
  );
};

// 按钮加载状态
interface ButtonLoaderProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  loading,
  children,
  className = '',
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute"
        >
          <LoadingSpinner size="sm" color="currentColor" />
        </motion.div>
      )}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
    </div>
  );
};

// 进度条加载
interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  showPercentage = false,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: 'var(--accent-color)' }}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      {showPercentage && (
        <p className="mt-2 text-sm text-[var(--text-muted)] text-center">
          {Math.round(clampedProgress)}%
        </p>
      )}
    </div>
  );
};

// 内容加载占位
interface ContentLoaderProps {
  lines?: number;
  className?: string;
}

export const ContentLoader: React.FC<ContentLoaderProps> = ({
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-[var(--border-color)] rounded"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.15,
          ease: 'easeInOut' as const,
        }}
          style={{ width: `${100 - (i % 3) * 20}%` }}
        />
      ))}
    </div>
  );
};

// 图片加载占位
interface ImageLoaderProps {
  className?: string;
  aspectRatio?: string;
}

export const ImageLoader: React.FC<ImageLoaderProps> = ({
  className = '',
  aspectRatio = '16/9',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[var(--bg-secondary)] ${className}`}
      style={{ aspectRatio }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <LoadingSpinner size="lg" color="var(--text-muted)" />
      </div>
    </div>
  );
};

export default LoadingSpinner;
