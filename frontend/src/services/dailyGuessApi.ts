import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 处理 API_URL，如果已经以 /api 结尾，则不再添加
const BASE_URL = API_URL.endsWith('/api') ? `${API_URL}/daily-guess` : `${API_URL}/api/daily-guess`;

// 创建 axios 实例
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 类型定义
export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DailyGuessItem {
  id: string;
  date: string;
  image_url: string;
  hint_keywords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  crop_region: CropRegion;
  fun_fact?: string;
}

export interface GuessResult {
  is_correct: boolean;
  similarity: number;
  score?: number;
  attempts: number;
  is_completed: boolean;
  message: string;
}

export interface UseHintResult {
  success: boolean;
  hint_keywords: string[];
  score_deduction: number;
}

export interface ExpandViewResult {
  success: boolean;
  new_crop_region: CropRegion;
  score_deduction: number;
}

export interface UserGameStats {
  current_streak: number;
  max_streak: number;
  total_score: number;
  games_played: number;
  today_completed: boolean;
  today_score?: number;
  today_attempts: number;
  today_used_hint: boolean;
  today_used_expand: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar?: string;
  total_score: number;
  games_played: number;
  current_streak: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  user_rank?: number;
  total_players: number;
}

export interface GameHistoryItem {
  date: string;
  score: number;
  attempts: number;
  used_hint: boolean;
  used_expand: boolean;
  is_completed: boolean;
}

export interface GameHistory {
  history: GameHistoryItem[];
  total_count: number;
}

// API 函数
export const dailyGuessApi = {
  /**
   * 获取今日题目
   */
  getTodayItem: async (): Promise<DailyGuessItem> => {
    const response = await api.get('/today');
    return response.data;
  },

  /**
   * 提交答案
   */
  submitGuess: async (guess: string): Promise<GuessResult> => {
    const response = await api.post('/submit', { guess });
    return response.data;
  },

  /**
   * 使用提示
   */
  useHint: async (): Promise<UseHintResult> => {
    const response = await api.post('/hint');
    return response.data;
  },

  /**
   * 扩大视野
   */
  expandView: async (): Promise<ExpandViewResult> => {
    const response = await api.post('/expand');
    return response.data;
  },

  /**
   * 获取用户统计
   */
  getStats: async (): Promise<UserGameStats> => {
    const response = await api.get('/stats');
    return response.data;
  },

  /**
   * 获取排行榜
   */
  getLeaderboard: async (limit: number = 100): Promise<LeaderboardData> => {
    const response = await api.get('/leaderboard', { params: { limit } });
    return response.data;
  },

  /**
   * 获取游戏历史
   */
  getHistory: async (limit: number = 30): Promise<GameHistory> => {
    const response = await api.get('/history', { params: { limit } });
    return response.data;
  },
};

export default dailyGuessApi;
