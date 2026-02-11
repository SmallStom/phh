import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Trophy, Clock, ChevronRight } from 'lucide-react';
import { DailyGuessGame } from './DailyGuessGame';
import { useGameStore } from '../../../store/gameStore';

export const DailyGuessCard: React.FC = () => {
  const [isGameOpen, setIsGameOpen] = useState(false);
  const { dailyGuess } = useGameStore();

  // 计算距离明天还有多少时间
  const getTimeUntilTomorrow = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时${minutes}分`;
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsGameOpen(true)}
        className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 cursor-pointer shadow-lg overflow-hidden relative"
      >
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8 blur-xl" />

        <div className="relative z-10">
          {/* 头部 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">每日一猜</h3>
                <p className="text-white/70 text-xs">考验眼力的时刻</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60" />
          </div>

          {/* 状态展示 */}
          {dailyGuess.todayCompleted ? (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 text-white mb-1">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span className="font-medium">今日已完成</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">得分: {dailyGuess.todayScore}</span>
                <span className="text-white/60 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getTimeUntilTomorrow()}后更新
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 text-white mb-1">
                <span className="text-2xl">🎯</span>
                <span className="font-medium">今日挑战进行中</span>
              </div>
              <p className="text-white/70 text-sm">
                已连续打卡 {dailyGuess.currentStreak} 天
              </p>
            </div>
          )}

          {/* 连续打卡徽章 */}
          {dailyGuess.currentStreak > 0 && (
            <div className="mt-3 flex items-center gap-1">
              <span className="text-xs text-white/60">连续打卡</span>
              <div className="flex">
                {Array.from({ length: Math.min(dailyGuess.currentStreak, 7) }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="w-5 h-5 rounded-full bg-yellow-400/80 flex items-center justify-center text-xs -ml-1 first:ml-0 border-2 border-purple-500"
                  >
                    🔥
                  </motion.div>
                ))}
                {dailyGuess.currentStreak > 7 && (
                  <span className="ml-1 text-white text-xs">+{dailyGuess.currentStreak - 7}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 游戏弹窗 */}
      <DailyGuessGame isOpen={isGameOpen} onClose={() => setIsGameOpen(false)} />
    </>
  );
};
