import { create } from 'zustand';
import { dailyGuessApi, type DailyGuessItem } from '../services/dailyGuessApi';

interface GameState {
  // 每日一猜游戏状态
  dailyGuess: {
    lastPlayedDate: string | null;
    currentStreak: number;
    maxStreak: number;
    totalScore: number;
    gamesPlayed: number;
    todayCompleted: boolean;
    todayScore: number | null;
    attempts: number;
    usedHint: boolean;
    usedExpand: boolean;
  };

  // 今日题目
  todayItem: DailyGuessItem | null;

  // 加载状态
  isLoading: boolean;
  error: string | null;

  // 动作
  fetchGameStats: () => Promise<void>;
  fetchTodayItem: () => Promise<void>;
  submitGuess: (guess: string) => Promise<{
    isCorrect: boolean;
    similarity: number;
    score?: number;
    message: string;
  }>;
  useHint: () => Promise<{ success: boolean; hintKeywords: string[] }>;
  expandView: () => Promise<{ success: boolean; newCropRegion: { x: number; y: number; width: number; height: number } }>;
  resetDailyGuess: () => void;
  clearError: () => void;
}

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

export const useGameStore = create<GameState>()(
  (set, get) => ({
    dailyGuess: {
      lastPlayedDate: null,
      currentStreak: 0,
      maxStreak: 0,
      totalScore: 0,
      gamesPlayed: 0,
      todayCompleted: false,
      todayScore: null,
      attempts: 0,
      usedHint: false,
      usedExpand: false,
    },

    todayItem: null,
    isLoading: false,
    error: null,

    // 获取游戏统计
    fetchGameStats: async () => {
      set({ isLoading: true, error: null });
      try {
        const stats = await dailyGuessApi.getStats();
        set({
          dailyGuess: {
            lastPlayedDate: stats.today_completed ? getTodayString() : null,
            currentStreak: stats.current_streak,
            maxStreak: stats.max_streak,
            totalScore: stats.total_score,
            gamesPlayed: stats.games_played,
            todayCompleted: stats.today_completed,
            todayScore: stats.today_score ?? null,
            attempts: stats.today_attempts,
            usedHint: stats.today_used_hint,
            usedExpand: stats.today_used_expand,
          },
          isLoading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '获取游戏数据失败',
          isLoading: false,
        });
      }
    },

    // 获取今日题目
    fetchTodayItem: async () => {
      set({ isLoading: true, error: null });
      try {
        const item = await dailyGuessApi.getTodayItem();
        set({
          todayItem: item,
          isLoading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '获取今日题目失败',
          isLoading: false,
        });
      }
    },

    // 提交答案
    submitGuess: async (guess: string) => {
      set({ isLoading: true, error: null });
      try {
        const result = await dailyGuessApi.submitGuess(guess);

        // 如果答对了，重新获取完整统计数据（包含总积分和连续打卡）
        if (result.is_correct && result.score) {
          const stats = await dailyGuessApi.getStats();
          set({
            dailyGuess: {
              lastPlayedDate: stats.today_completed ? getTodayString() : null,
              currentStreak: stats.current_streak,
              maxStreak: stats.max_streak,
              totalScore: stats.total_score,
              gamesPlayed: stats.games_played,
              todayCompleted: stats.today_completed,
              todayScore: stats.today_score ?? null,
              attempts: stats.today_attempts,
              usedHint: stats.today_used_hint,
              usedExpand: stats.today_used_expand,
            },
            isLoading: false,
          });
        } else {
          // 更新本地状态
          set((state) => ({
            dailyGuess: {
              ...state.dailyGuess,
              attempts: result.attempts,
              todayCompleted: result.is_completed,
              todayScore: result.score ?? state.dailyGuess.todayScore,
            },
            isLoading: false,
          }));
        }

        return {
          isCorrect: result.is_correct,
          similarity: result.similarity,
          score: result.score,
          message: result.message,
        };
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '提交答案失败',
          isLoading: false,
        });
        throw error;
      }
    },

    // 使用提示
    useHint: async () => {
      set({ isLoading: true, error: null });
      try {
        const result = await dailyGuessApi.useHint();

        set((state) => ({
          dailyGuess: {
            ...state.dailyGuess,
            usedHint: true,
          },
          isLoading: false,
        }));

        return {
          success: result.success,
          hintKeywords: result.hint_keywords,
        };
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '使用提示失败',
          isLoading: false,
        });
        throw error;
      }
    },

    // 扩大视野
    expandView: async () => {
      set({ isLoading: true, error: null });
      try {
        const result = await dailyGuessApi.expandView();

        set((state) => ({
          dailyGuess: {
            ...state.dailyGuess,
            usedExpand: true,
          },
          // 更新今日题目的裁剪区域
          todayItem: state.todayItem
            ? {
                ...state.todayItem,
                crop_region: result.new_crop_region,
              }
            : null,
          isLoading: false,
        }));

        return {
          success: result.success,
          newCropRegion: result.new_crop_region,
        };
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '扩大视野失败',
          isLoading: false,
        });
        throw error;
      }
    },

    // 重置每日游戏状态（检查日期变化）
    resetDailyGuess: () => {
      const today = getTodayString();
      const state = get().dailyGuess;

      // 如果日期变了，重置今日状态
      if (state.lastPlayedDate !== today) {
        set({
          dailyGuess: {
            ...state,
            todayCompleted: false,
            todayScore: null,
            attempts: 0,
            usedHint: false,
            usedExpand: false,
          },
        });
      }
    },

    // 清除错误
    clearError: () => {
      set({ error: null });
    },
  })
);
