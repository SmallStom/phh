import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      
      toggleTheme: () => {
        const newValue = !get().isDarkMode;
        set({ isDarkMode: newValue });
        
        // 更新 DOM
        if (newValue) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      
      setDarkMode: (isDark: boolean) => {
        set({ isDarkMode: isDark });
        
        // 更新 DOM
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'phh-theme-storage',
      onRehydrateStorage: () => (state) => {
        // 恢复时同步 DOM
        if (state?.isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }
  )
);

// 初始化主题（在应用启动时调用）
export const initTheme = () => {
  const stored = localStorage.getItem('phh-theme-storage');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state.isDarkMode) {
        document.documentElement.classList.add('dark');
      }
    } catch {
      // 解析失败，使用系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  } else {
    // 没有存储的主题，使用系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }
};
