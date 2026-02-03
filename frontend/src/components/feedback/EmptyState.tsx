import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    to?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    to?: string;
  };
  className?: string;
}

// 通用空状态组件
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = '暂无内容',
  description = '这里还没有任何内容',
  icon,
  action,
  secondaryAction,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleAction = (act?: { onClick?: () => void; to?: string }) => {
    if (act?.onClick) {
      act.onClick();
    } else if (act?.to) {
      navigate(act.to);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      {/* 图标区域 */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6"
      >
        {icon || <DefaultEmptyIcon />}
      </motion.div>

      {/* 标题 */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-[var(--text-primary)] mb-2"
      >
        {title}
      </motion.h3>

      {/* 描述 */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-[var(--text-secondary)] max-w-md mb-8"
      >
        {description}
      </motion.p>

      {/* 操作按钮 */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {action && (
            <button
              onClick={() => handleAction(action)}
              className="btn-primary px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={() => handleAction(secondaryAction)}
              className="px-6 py-2.5 rounded-xl font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all duration-200"
            >
              {secondaryAction.label}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

// 默认空状态图标
const DefaultEmptyIcon: React.FC = () => (
  <div className="w-24 h-24 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
    <svg
      className="w-12 h-12 text-[var(--text-muted)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  </div>
);

// 记录列表空状态
export const EmptyRecords: React.FC<{ onCreate?: () => void }> = ({ onCreate }) => (
  <EmptyState
    title="还没有记录"
    description="开始记录你的想法、日志和笔记吧，让美好的瞬间被保存下来"
    icon={<RecordsIcon />}
    action={{
      label: '写第一条记录',
      onClick: onCreate,
      to: '/records/new',
    }}
  />
);

// 经历列表空状态
export const EmptyExperiences: React.FC<{ onCreate?: () => void }> = ({ onCreate }) => (
  <EmptyState
    title="还没有经历"
    description="添加你的工作、项目、教育经历，打造属于你的时间轴"
    icon={<ExperiencesIcon />}
    action={{
      label: '添加经历',
      onClick: onCreate,
      to: '/experiences/new',
    }}
  />
);

// 收藏列表空状态
export const EmptyCollections: React.FC<{ onCreate?: () => void }> = ({ onCreate }) => (
  <EmptyState
    title="还没有收藏"
    description="收藏你喜欢的文章、视频、工具，建立你的个人知识库"
    icon={<CollectionsIcon />}
    action={{
      label: '创建收藏',
      onClick: onCreate,
      to: '/collections/new',
    }}
  />
);

// 搜索结果空状态
export const EmptySearch: React.FC<{ query?: string; onClear?: () => void }> = ({ 
  query, 
  onClear 
}) => (
  <EmptyState
    title={query ? `未找到 "${query}" 的相关内容` : '请输入搜索关键词'}
    description={query ? '尝试使用其他关键词或检查拼写' : '输入关键词开始搜索记录、经历和收藏'}
    icon={<SearchIcon />}
    action={query ? {
      label: '清除搜索',
      onClick: onClear,
    } : undefined}
  />
);

// 广场空状态
export const EmptyPlaza: React.FC = () => (
  <EmptyState
    title="广场很安静"
    description="还没有公开的记录，成为第一个分享的人吧"
    icon={<PlazaIcon />}
  />
);

// 网络错误状态
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    title="网络出错了"
    description="请检查网络连接，或稍后重试"
    icon={<ErrorIcon />}
    action={{
      label: '重试',
      onClick: onRetry,
    }}
  />
);

// 404 页面
export const NotFound: React.FC = () => (
  <EmptyState
    title="页面不存在"
    description="你访问的页面可能已经删除或移动"
    icon={<NotFoundIcon />}
    action={{
      label: '返回首页',
      to: '/',
    }}
  />
);

// 图标组件
const RecordsIcon: React.FC = () => (
  <motion.div
    className="w-24 h-24 rounded-full bg-gradient-to-br from-forest-100 to-forest-200 dark:from-forest-900/30 dark:to-forest-800/30 flex items-center justify-center"
    animate={{ 
      rotate: [0, 5, -5, 0],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    <svg className="w-12 h-12 text-forest-600 dark:text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  </motion.div>
);

const ExperiencesIcon: React.FC = () => (
  <motion.div
    className="w-24 h-24 rounded-full bg-gradient-to-br from-terracotta-100 to-terracotta-200 dark:from-terracotta-900/30 dark:to-terracotta-800/30 flex items-center justify-center"
    animate={{ 
      scale: [1, 1.05, 1],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    <svg className="w-12 h-12 text-terracotta-600 dark:text-terracotta-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </motion.div>
);

const CollectionsIcon: React.FC = () => (
  <motion.div
    className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center"
    animate={{ 
      y: [0, -5, 0],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
      }}
    >
      <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  </motion.div>
);

const SearchIcon: React.FC = () => (
  <motion.div
    className="w-24 h-24 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center"
    animate={{ 
      x: [0, 5, 0],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    <svg className="w-12 h-12 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </motion.div>
);

const PlazaIcon: React.FC = () => (
  <motion.div
    className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center"
    animate={{ 
      rotate: [0, 360],
    }}
    transition={{
      duration: 20,
      repeat: Infinity,
      ease: 'linear',
    }}
  >
    <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  </motion.div>
);

const ErrorIcon: React.FC = () => (
  <motion.div
    className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
    animate={{
      x: [0, -5, 5, -5, 5, 0],
    }}
    transition={{
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 3,
    }}
  >
    <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  </motion.div>
);

const NotFoundIcon: React.FC = () => (
  <motion.div
    className="w-24 h-24 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center"
    animate={{ 
      rotateY: [0, 180, 360],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    <svg className="w-12 h-12 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </motion.div>
);

export default EmptyState;
