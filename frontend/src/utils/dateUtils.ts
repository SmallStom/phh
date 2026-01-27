const parseDate = (dateString: string): Date => {
  if (!dateString) {
    return new Date();
  }
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', dateString);
    return new Date();
  }
  
  return date;
};



export const formatDateTime = (dateString: string): string => {
  const date = parseDate(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

export const formatDate = (dateString: string): string => {
  const date = parseDate(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatTime = (dateString: string): string => {
  const date = parseDate(dateString);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

export const formatRelativeTime = (dateString: string): string => {
  const date = parseDate(dateString);
  const now = new Date();
  
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return formatDate(dateString);
  }
};