import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Lightbulb, Trophy, Share2, X, Sparkles, Loader2 } from 'lucide-react';
import { useGameStore } from '../../../store/gameStore';

interface DailyGuessGameProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyGuessGame: React.FC<DailyGuessGameProps> = ({ isOpen, onClose }) => {
  const [userGuess, setUserGuess] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'revealed' | 'completed'>('playing');
  const [result, setResult] = useState<{ isCorrect: boolean; similarity: number; message: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [expandedCrop, setExpandedCrop] = useState(false);
  const [shake, setShake] = useState(false);
  const [hintKeywords, setHintKeywords] = useState<string[]>([]);
  const [cropRegion, setCropRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const {
    dailyGuess,
    todayItem,
    isLoading,
    error,
    fetchGameStats,
    fetchTodayItem,
    submitGuess,
    useHint,
    expandView,
    resetDailyGuess,
    clearError,
  } = useGameStore();

  // 初始化游戏数据
  useEffect(() => {
    if (isOpen) {
      resetDailyGuess();
      fetchGameStats();
      fetchTodayItem();
    }
  }, [isOpen, fetchGameStats, fetchTodayItem, resetDailyGuess]);

  // 根据后端状态更新本地状态
  useEffect(() => {
    if (todayItem && !cropRegion) {
      setCropRegion(todayItem.crop_region);
    }
  }, [todayItem, cropRegion]);

  useEffect(() => {
    if (dailyGuess.todayCompleted) {
      setGameState('completed');
    } else {
      setGameState('playing');
      setUserGuess('');
      setResult(null);
      setShowHint(false);
      setExpandedCrop(false);
      setHintKeywords([]);
    }
  }, [dailyGuess.todayCompleted]);

  const handleSubmit = async () => {
    if (!userGuess.trim()) return;

    try {
      const guessResult = await submitGuess(userGuess);
      setResult({
        isCorrect: guessResult.isCorrect,
        similarity: guessResult.similarity,
        message: guessResult.message,
      });

      if (guessResult.isCorrect) {
        setGameState('revealed');
        setTimeout(() => setGameState('completed'), 3000);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (error) {
      // 错误已在 store 中处理
    }
  };

  const handleUseHint = async () => {
    try {
      const hintResult = await useHint();
      setHintKeywords(hintResult.hintKeywords);
      setShowHint(true);
    } catch (error) {
      // 错误已在 store 中处理
    }
  };

  const handleExpandCrop = async () => {
    try {
      const expandResult = await expandView();
      setCropRegion(expandResult.newCropRegion);
      setExpandedCrop(true);
    } catch (error) {
      // 错误已在 store 中处理
    }
  };

  const handleShare = () => {
    const text = `我在「每日一猜」中${dailyGuess.todayScore && dailyGuess.todayScore >= 80 ? '完美' : ''}猜对了！\n今日得分：${dailyGuess.todayScore}分\n连续打卡：${dailyGuess.currentStreak}天\n\n来挑战一下吧！`;

    if (navigator.share) {
      navigator.share({
        title: '每日一猜',
        text,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('结果已复制到剪贴板！');
    }
  };

  if (!isOpen) return null;

  // 加载状态
  if (isLoading && !todayItem) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-black/50"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
        >
          <div className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-2xl shadow-2xl p-8 pointer-events-auto flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-terracotta-500 animate-spin mb-4" />
            <p className="text-[var(--text-secondary)]">加载中...</p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // 错误状态
  if (error && !todayItem) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-black/50"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
        >
          <div className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-2xl shadow-2xl p-8 pointer-events-auto">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => {
                  clearError();
                  fetchTodayItem();
                }}
                className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // 没有题目数据
  if (!todayItem) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-black/50"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
        >
          <div className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-2xl shadow-2xl p-8 pointer-events-auto text-center">
            <p className="text-[var(--text-secondary)]">今日题目尚未发布，请稍后再试</p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const currentCropRegion = cropRegion || todayItem.crop_region;

  const cropStyle = {
    clipPath: expandedCrop
      ? `inset(${currentCropRegion.y - 10}% ${100 - currentCropRegion.x - currentCropRegion.width - 10}% ${100 - currentCropRegion.y - currentCropRegion.height - 10}% ${currentCropRegion.x - 10}%)`
      : `inset(${currentCropRegion.y}% ${100 - currentCropRegion.x - currentCropRegion.width}% ${100 - currentCropRegion.y - currentCropRegion.height}% ${currentCropRegion.x}%)`,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 透明遮罩层 - 只用于捕获点击事件 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            onClick={onClose}
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 头部 */}
              <div className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 px-6 py-4">
                <div className="flex items-center gap-2 text-white">
                  <Eye className="w-6 h-6" />
                  <h2 className="text-xl font-bold">每日一猜</h2>
                </div>
                <p className="text-white/80 text-sm mt-1">
                  只看局部，猜猜这是什么？
                </p>
              </div>

              <div className="p-6">
                {/* 统计信息 */}
                <div className="flex items-center justify-between mb-4 text-sm text-[var(--text-muted)]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      {dailyGuess.currentStreak}天连续
                    </span>
                    <span>总积分: {dailyGuess.totalScore}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    todayItem.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    todayItem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {todayItem.difficulty === 'easy' ? '简单' :
                     todayItem.difficulty === 'medium' ? '中等' : '困难'}
                  </span>
                </div>

                {/* 游戏完成状态 */}
                {gameState === 'completed' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <div className="mb-6">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <Trophy className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                        今日已完成！
                      </h3>
                      <p className="text-[var(--text-muted)]">
                        得分: <span className="text-terracotta-500 font-bold text-xl">{dailyGuess.todayScore}</span> 分
                      </p>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        连续打卡: {dailyGuess.currentStreak} 天
                      </p>
                    </div>

                    {/* 完整图片展示 */}
                    <div className="relative rounded-xl overflow-hidden mb-4">
                      <img
                        src={todayItem.image_url}
                        alt="今日答案"
                        className="w-full h-48 object-cover"
                      />
                    </div>

                    <p className="text-[var(--text-secondary)] mb-6">
                      {todayItem.fun_fact}
                    </p>

                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-6 py-3 bg-terracotta-500 text-white rounded-xl font-medium hover:bg-terracotta-600 transition-colors"
                      >
                        <Share2 className="w-5 h-5" />
                        分享成绩
                      </button>
                    </div>

                    <p className="text-sm text-[var(--text-muted)] mt-6">
                      明天 00:00 更新新题目
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {/* 图片区域 */}
                    <div className="relative mb-6">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-[var(--bg-secondary)]">
                        {/* 完整图片（揭示时显示） */}
                        <AnimatePresence>
                          {gameState === 'revealed' && (
                            <motion.img
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5 }}
                              src={todayItem.image_url}
                              alt="答案"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}
                        </AnimatePresence>

                        {/* 裁剪图片 */}
                        <motion.img
                          src={todayItem.image_url}
                          alt="猜猜看"
                          className="absolute inset-0 w-full h-full object-cover"
                          style={cropStyle}
                          animate={{
                            clipPath: expandedCrop
                              ? `inset(${currentCropRegion.y - 10}% ${100 - currentCropRegion.x - currentCropRegion.width - 10}% ${100 - currentCropRegion.y - currentCropRegion.height - 10}% ${currentCropRegion.x - 10}%)`
                              : `inset(${currentCropRegion.y}% ${100 - currentCropRegion.x - currentCropRegion.width}% ${100 - currentCropRegion.y - currentCropRegion.height}% ${currentCropRegion.x}%)`
                          }}
                          transition={{ duration: 0.3 }}
                        />

                        {/* 提示遮罩 */}
                        {showHint && gameState === 'playing' && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
                          >
                            <p className="text-white text-sm">
                              <span className="font-medium">提示：</span>
                              看起来像是 {hintKeywords.slice(0, 2).join('、')}
                            </p>
                          </motion.div>
                        )}
                      </div>

                      {/* 扩大区域按钮 */}
                      {!expandedCrop && gameState === 'playing' && (
                        <button
                          onClick={handleExpandCrop}
                          disabled={isLoading}
                          className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-terracotta-500 text-white text-sm rounded-full shadow-lg hover:bg-terracotta-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <Eye className="w-4 h-4" />
                          扩大视野 (-10分)
                        </button>
                      )}
                    </div>

                    {/* 输入区域 */}
                    {gameState === 'playing' && (
                      <motion.div
                        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="flex gap-2 mb-4">
                          <input
                            type="text"
                            value={userGuess}
                            onChange={(e) => setUserGuess(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="输入你的猜测..."
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-terracotta-400 transition-colors disabled:opacity-50"
                          />
                          <button
                            onClick={handleSubmit}
                            disabled={!userGuess.trim() || isLoading}
                            className="px-6 py-3 bg-terracotta-500 text-white rounded-xl font-medium hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '猜测'}
                          </button>
                        </div>

                        {/* 提示按钮 */}
                        {!showHint && (
                          <button
                            onClick={handleUseHint}
                            disabled={isLoading}
                            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-terracotta-500 transition-colors disabled:opacity-50"
                          >
                            <Lightbulb className="w-4 h-4" />
                            获取提示 (-30分)
                          </button>
                        )}

                        {/* 错误提示 */}
                        {result && !result.isCorrect && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 text-sm mt-2"
                          >
                            {result.message}
                          </motion.p>
                        )}
                      </motion.div>
                    )}

                    {/* 揭示状态 */}
                    {gameState === 'revealed' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                      >
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Sparkles className="w-6 h-6 text-yellow-500" />
                          <span className="text-2xl font-bold text-terracotta-500">猜对了！</span>
                        </div>
                        <p className="text-[var(--text-muted)] mb-4">
                          获得 {dailyGuess.todayScore} 分
                        </p>
                        <p className="text-[var(--text-secondary)] text-sm">
                          {todayItem.fun_fact}
                        </p>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
