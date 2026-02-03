import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animate = true,
}) => {
  const baseStyles = 'bg-[var(--border-color)]';
  
  const variantStyles = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  if (animate) {
    return (
      <motion.div
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        style={style}
        initial={{ opacity: 0.5 }}
        animate={{ 
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      }}
      />
    );
  }

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
};

// 记录卡片骨架屏
export const RecordCardSkeleton: React.FC = () => {
  return (
    <div className="card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="space-y-2">
            <Skeleton width={120} height={16} />
            <Skeleton width={80} height={12} />
          </div>
        </div>
        <Skeleton width={60} height={24} className="rounded-full" />
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <Skeleton width="80%" height={20} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="90%" height={16} />
        <Skeleton width="60%" height={16} />
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-4">
          <Skeleton width={50} height={16} />
          <Skeleton width={50} height={16} />
        </div>
        <Skeleton width={80} height={16} />
      </div>
    </div>
  );
};

// 经历卡片骨架屏
export const ExperienceCardSkeleton: React.FC = () => {
  return (
    <div className="relative pl-8 pb-8">
      {/* Timeline dot */}
      <Skeleton 
        variant="circular" 
        width={16} 
        height={16} 
        className="absolute left-0 top-2" 
      />
      
      {/* Card */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton width={24} height={24} className="rounded-lg" />
          <Skeleton width={100} height={18} />
        </div>
        <Skeleton width="70%" height={20} />
        <div className="space-y-2">
          <Skeleton width="100%" height={14} />
          <Skeleton width="80%" height={14} />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Skeleton width={60} height={20} className="rounded-full" />
          <Skeleton width={60} height={20} className="rounded-full" />
        </div>
      </div>
    </div>
  );
};

// 收藏卡片骨架屏
export const CollectionCardSkeleton: React.FC = () => {
  return (
    <div className="card overflow-hidden">
      {/* Image */}
      <Skeleton width="100%" height={160} className="rounded-none" />
      
      {/* Content */}
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton width={20} height={20} className="rounded" />
          <Skeleton width={80} height={14} />
        </div>
        <Skeleton width="90%" height={20} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="60%" height={14} />
        <div className="flex items-center justify-between pt-2">
          <Skeleton width={100} height={14} />
          <Skeleton width={60} height={14} />
        </div>
      </div>
    </div>
  );
};

// 详情页骨架屏
export const RecordDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={100} height={40} className="rounded-xl" />
        <div className="flex items-center gap-3">
          <Skeleton width={80} height={36} className="rounded-lg" />
          <Skeleton width={80} height={36} className="rounded-lg" />
        </div>
      </div>
      
      {/* Title */}
      <Skeleton width="70%" height={36} />
      
      {/* Meta */}
      <div className="flex items-center gap-4">
        <Skeleton width={100} height={16} />
        <Skeleton width={80} height={16} />
        <Skeleton width={60} height={24} className="rounded-full" />
      </div>
      
      {/* Content */}
      <div className="space-y-4 pt-6">
        <Skeleton width="100%" height={16} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="95%" height={16} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="90%" height={16} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="85%" height={16} />
      </div>
      
      {/* Tags */}
      <div className="flex items-center gap-2 pt-4">
        <Skeleton width={60} height={28} className="rounded-full" />
        <Skeleton width={70} height={28} className="rounded-full" />
        <Skeleton width={50} height={28} className="rounded-full" />
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-4 pt-6 border-t border-[var(--border-color)]">
        <Skeleton width={80} height={40} className="rounded-xl" />
        <Skeleton width={80} height={40} className="rounded-xl" />
        <Skeleton width={80} height={40} className="rounded-xl" />
      </div>
    </div>
  );
};

// 列表骨架屏（带 stagger 动画）
interface SkeletonListProps {
  count?: number;
  type?: 'record' | 'experience' | 'collection';
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ 
  count = 5, 
  type = 'record' 
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95,
    },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
        mass: 0.8,
      },
    },
  };

  const SkeletonComponent = {
    record: RecordCardSkeleton,
    experience: ExperienceCardSkeleton,
    collection: CollectionCardSkeleton,
  }[type];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {Array.from({ length: count }).map((_, index) => (
        <motion.div key={index} variants={itemVariants}>
          <SkeletonComponent />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default Skeleton;
