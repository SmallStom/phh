/**
 * 时间格式化工具函数
 * 统一显示为北京时间
 * 
 * 说明：
 * - 后端数据库可能混合存储了 UTC 时间和北京时间（开发过程中的历史数据）
 * - 此工具函数会智能处理两种情况，确保最终显示北京时间
 */

// 北京时区偏移（毫秒）
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * 检测时间是否可能是 UTC 时间被误解析为本地时间
 * 如果解析后的时间比当前时间早约 8 小时，说明可能是 UTC 时间
 * 
 * 原理：
 * - 后端返回 UTC 时间：2026-02-03T04:00:00Z
 * - 浏览器解析为本地时间：2026-02-03 04:00:00（当成北京时间）
 * - 实际北京时间应该是：2026-02-03 12:00:00
 * - 所以解析后的时间比实际时间早 8 小时
 */
const isProbablyUTCTime = (date: Date): boolean => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  // 如果时间在 7-9 小时前，可能是 UTC 时间被误解析
  return diff > 7 * 60 * 60 * 1000 && diff < 9 * 60 * 60 * 1000;
};

/**
 * 解析后端返回的时间字符串
 */
const parseTime = (time: string | Date): Date => {
  if (time instanceof Date) {
    return new Date(time.getTime());
  }
  return new Date(time);
};

/**
 * 将时间转换为北京时间
 * 智能处理：如果检测到是 UTC 时间被误解析，则加 8 小时
 */
const toBeijingTime = (date: Date): Date => {
  // 如果时间是 UTC 被误解析为本地时间（比实际时间早 8 小时）
  if (isProbablyUTCTime(date)) {
    // 加上 8 小时，得到正确的北京时间
    return new Date(date.getTime() + BEIJING_OFFSET_MS);
  }
  // 否则假设已经是北京时间
  return date;
};

/**
 * 格式化相对时间（刚刚、几分钟前等）
 */
export const formatRelativeTime = (time: string | Date): string => {
  const parsedDate = parseTime(time);
  const beijingDate = toBeijingTime(parsedDate);
  const now = new Date();
  
  const diff = now.getTime() - beijingDate.getTime();
  
  // 如果时间是未来的，显示刚刚
  if (diff < 0) return '刚刚';
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (seconds < 10) return '刚刚';
  if (seconds < 60) return `${seconds}秒前`;
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;
  return `${Math.floor(days / 365)}年前`;
};

/**
 * 格式化绝对时间（北京时间）
 * 格式: 2026/01/30 14:11
 */
export const formatAbsoluteTime = (time: string | Date): string => {
  const parsedDate = parseTime(time);
  const beijingDate = toBeijingTime(parsedDate);
  
  const year = beijingDate.getFullYear();
  const month = String(beijingDate.getMonth() + 1).padStart(2, '0');
  const day = String(beijingDate.getDate()).padStart(2, '0');
  const hour = String(beijingDate.getHours()).padStart(2, '0');
  const minute = String(beijingDate.getMinutes()).padStart(2, '0');
  
  return `${year}/${month}/${day} ${hour}:${minute}`;
};

/**
 * 格式化日期时间，带秒（北京时间）
 * 格式: 2026/01/30 14:11:09
 */
export const formatDateTime = (time: string | Date): string => {
  const parsedDate = parseTime(time);
  const beijingDate = toBeijingTime(parsedDate);
  
  const year = beijingDate.getFullYear();
  const month = String(beijingDate.getMonth() + 1).padStart(2, '0');
  const day = String(beijingDate.getDate()).padStart(2, '0');
  const hour = String(beijingDate.getHours()).padStart(2, '0');
  const minute = String(beijingDate.getMinutes()).padStart(2, '0');
  const second = String(beijingDate.getSeconds()).padStart(2, '0');
  
  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
};

/**
 * 格式化日期（北京时间）
 * 格式: 2026/01/30
 */
export const formatDate = (time: string | Date): string => {
  const parsedDate = parseTime(time);
  const beijingDate = toBeijingTime(parsedDate);
  
  const year = beijingDate.getFullYear();
  const month = String(beijingDate.getMonth() + 1).padStart(2, '0');
  const day = String(beijingDate.getDate()).padStart(2, '0');
  
  return `${year}/${month}/${day}`;
};

/**
 * 格式化时间，只显示时分（北京时间）
 * 格式: 14:11
 */
export const formatTimeOnly = (time: string | Date): string => {
  const parsedDate = parseTime(time);
  const beijingDate = toBeijingTime(parsedDate);
  
  const hour = String(beijingDate.getHours()).padStart(2, '0');
  const minute = String(beijingDate.getMinutes()).padStart(2, '0');
  
  return `${hour}:${minute}`;
};

/**
 * 获取友好的时间显示
 * 如果是今天，显示"今天 HH:mm"
 * 如果是昨天，显示"昨天 HH:mm"
 * 如果是今年，显示"MM-DD HH:mm"
 * 否则显示"YYYY/MM/DD HH:mm"
 */
export const formatFriendlyTime = (time: string | Date): string => {
  const parsedDate = parseTime(time);
  const beijingDate = toBeijingTime(parsedDate);
  const now = new Date();
  
  const year = beijingDate.getFullYear();
  const month = beijingDate.getMonth();
  const day = beijingDate.getDate();
  
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const nowDay = now.getDate();
  
  const hour = String(beijingDate.getHours()).padStart(2, '0');
  const minute = String(beijingDate.getMinutes()).padStart(2, '0');
  const timeStr = `${hour}:${minute}`;
  
  // 计算日期差
  const dateOnly = new Date(year, month, day);
  const nowDateOnly = new Date(nowYear, nowMonth, nowDay);
  const diffDays = Math.floor((nowDateOnly.getTime() - dateOnly.getTime()) / 86400000);
  
  if (diffDays === 0) {
    return `今天 ${timeStr}`;
  } else if (diffDays === 1) {
    return `昨天 ${timeStr}`;
  } else if (year === nowYear) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${monthStr}-${dayStr} ${timeStr}`;
  } else {
    return formatAbsoluteTime(time);
  }
};
