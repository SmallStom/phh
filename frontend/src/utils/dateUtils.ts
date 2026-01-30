/**
 * 日期时间工具函数
 * 已弃用：请使用 time.ts 中的函数，统一使用北京时间
 */

import {
  formatDateTime as formatDateTimeBeijing,
  formatDate as formatDateBeijing,
  formatTimeOnly as formatTimeBeijing,
  formatRelativeTime as formatRelativeTimeBeijing,
} from './time';

/**
 * @deprecated 请使用 time.ts 中的 formatDateTime
 */
export const formatDateTime = (dateString: string): string => {
  return formatDateTimeBeijing(dateString);
};

/**
 * @deprecated 请使用 time.ts 中的 formatDate
 */
export const formatDate = (dateString: string): string => {
  return formatDateBeijing(dateString);
};

/**
 * @deprecated 请使用 time.ts 中的 formatTimeOnly
 */
export const formatTime = (dateString: string): string => {
  return formatTimeBeijing(dateString);
};

/**
 * @deprecated 请使用 time.ts 中的 formatRelativeTime
 */
export const formatRelativeTime = (dateString: string): string => {
  return formatRelativeTimeBeijing(dateString);
};
