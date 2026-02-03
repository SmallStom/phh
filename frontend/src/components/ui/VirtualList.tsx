import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
  onScrollEnd?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  emptyComponent?: React.ReactNode;
}

// 虚拟滚动列表组件
export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
  className = '',
  onScrollEnd,
  loadingMore = false,
  hasMore = false,
  emptyComponent,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // 计算可见区域
  const { virtualItems, totalHeight } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);

    const virtualItems = items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        left: 0,
        right: 0,
      },
    }));

    return { virtualItems, totalHeight };
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  // 处理滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // 清除之前的定时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 滚动停止检测
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    // 检测是否滚动到底部
    if (onScrollEnd && hasMore && !loadingMore) {
      const scrollHeight = e.currentTarget.scrollHeight;
      const clientHeight = e.currentTarget.clientHeight;
      const scrollBottom = newScrollTop + clientHeight;

      // 距离底部 100px 时触发加载更多
      if (scrollHeight - scrollBottom < 100) {
        onScrollEnd();
      }
    }
  }, [onScrollEnd, hasMore, loadingMore]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 空状态
  if (items.length === 0 && emptyComponent) {
    return (
      <div
        ref={containerRef}
        className={`overflow-auto ${className}`}
        style={{ height: containerHeight }}
      >
        {emptyComponent}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(({ item, index, style }) => (
          <div
            key={index}
            style={style}
            className={isScrolling ? 'will-change-transform' : ''}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* 加载更多指示器 */}
      {loadingMore && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center py-4"
        >
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <LoadingDots />
            <span className="text-sm">加载中...</span>
          </div>
        </motion.div>
      )}

      {/* 没有更多数据 */}
      {!hasMore && items.length > 0 && (
        <div className="flex items-center justify-center py-6 text-[var(--text-muted)] text-sm">
          <span>—— 已经到底了 ——</span>
        </div>
      )}
    </div>
  );
}

// 加载动画点
const LoadingDots: React.FC = () => (
  <div className="flex items-center gap-1">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)]"
        animate={{
          scale: [0.5, 1, 0.5],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.15,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

// 带分页的虚拟列表
interface PaginatedVirtualListProps<T> extends Omit<VirtualListProps<T>, 'onScrollEnd' | 'loadingMore' | 'hasMore'> {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function PaginatedVirtualList<T>({
  page,
  pageSize,
  total,
  onPageChange,
  loading = false,
  ...virtualListProps
}: PaginatedVirtualListProps<T>) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <VirtualList {...virtualListProps} containerHeight={virtualListProps.containerHeight - 60} />
      </div>

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4 border-t border-[var(--border-color)]">
          <PaginationButton
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
          >
            ←
          </PaginationButton>

          <div className="flex items-center gap-1">
            {generatePageNumbers(page, totalPages).map((pageNum, index) => (
              <React.Fragment key={index}>
                {pageNum === '...' ? (
                  <span className="px-2 text-[var(--text-muted)]">...</span>
                ) : (
                  <PaginationButton
                    active={pageNum === page}
                    onClick={() => typeof pageNum === 'number' && onPageChange(pageNum)}
                    disabled={loading}
                  >
                    {pageNum}
                  </PaginationButton>
                )}
              </React.Fragment>
            ))}
          </div>

          <PaginationButton
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
          >
            →
          </PaginationButton>

          <span className="ml-4 text-sm text-[var(--text-muted)]">
            共 {total} 条
          </span>
        </div>
      )}
    </div>
  );
}

// 分页按钮
interface PaginationButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}

const PaginationButton: React.FC<PaginationButtonProps> = ({
  children,
  onClick,
  disabled = false,
  active = false,
}) => (
  <motion.button
    whileHover={!disabled ? { scale: 1.05 } : {}}
    whileTap={!disabled ? { scale: 0.95 } : {}}
    onClick={onClick}
    disabled={disabled}
    className={`
      min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors
      ${active
        ? 'bg-[var(--accent-color)] text-white'
        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  >
    {children}
  </motion.button>
);

// 生成页码数组
function generatePageNumbers(current: number, total: number): (number | string)[] {
  const pages: (number | string)[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (current > 3) {
      pages.push('...');
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push('...');
    }

    pages.push(total);
  }

  return pages;
}

// 无限滚动列表（简化版）
interface InfiniteScrollListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  className?: string;
  emptyComponent?: React.ReactNode;
}

export function InfiniteScrollList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  onLoadMore,
  hasMore,
  loading,
  className = '',
  emptyComponent,
}: InfiniteScrollListProps<T>) {
  return (
    <VirtualList
      items={items}
      renderItem={renderItem}
      itemHeight={itemHeight}
      containerHeight={containerHeight}
      onScrollEnd={onLoadMore}
      loadingMore={loading}
      hasMore={hasMore}
      className={className}
      emptyComponent={emptyComponent}
    />
  );
}

export default VirtualList;
