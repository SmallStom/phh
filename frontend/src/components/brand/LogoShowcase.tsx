import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Logo, LogoIcon, LoadingLogo, LogoBadge } from './Logo';

type DesignType = 'y-letter' | 'yang-character' | 'sheep';

const LogoShowcase: React.FC = () => {
  const [selectedDesign, setSelectedDesign] = useState<DesignType>('y-letter');
  const [animated, setAnimated] = useState(true);

  const designs: { id: DesignType; name: string; description: string }[] = [
    {
      id: 'y-letter',
      name: '字母 Y',
      description: 'Y 字母 + 树枝分叉设计，寓意向上生长、蓬勃发展',
    },
    {
      id: 'yang-character',
      name: '汉字 杨',
      description: '简化汉字"杨"，木字旁 + 昜，体现姓氏文化',
    },
    {
      id: 'sheep',
      name: '小羊',
      description: '可爱小羊造型，谐音"杨"，温顺友善的形象',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
            品牌 Logo 设计方案
          </h1>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            基于姓氏"杨"的三个设计方向：字母 Y、汉字杨、动物羊
          </p>
        </motion.div>

        {/* 设计选择器 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {designs.map((design) => (
            <button
              key={design.id}
              onClick={() => setSelectedDesign(design.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                selectedDesign === design.id
                  ? 'bg-[var(--accent-color)] text-white shadow-lg'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
              }`}
            >
              {design.name}
            </button>
          ))}
        </motion.div>

        {/* 动画开关 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-[var(--text-secondary)]">启用动画</span>
            <button
              onClick={() => setAnimated(!animated)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                animated ? 'bg-[var(--accent-color)]' : 'bg-[var(--border-color)]'
              }`}
            >
              <motion.div
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                animate={{ left: animated ? '28px' : '4px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </label>
        </motion.div>

        {/* 当前选中设计的描述 */}
        <motion.div
          key={selectedDesign}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            {designs.find((d) => d.id === selectedDesign)?.name}
          </h2>
          <p className="text-[var(--text-secondary)]">
            {designs.find((d) => d.id === selectedDesign)?.description}
          </p>
        </motion.div>

        {/* 主展示区 */}
        <motion.div
          key={selectedDesign}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
        >
          {/* 大号展示 */}
          <div className="card p-12 flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-8">
              大尺寸展示
            </h3>
            <Logo size="xl" animated={animated} design={selectedDesign} />
          </div>

          {/* 图标展示 */}
          <div className="card p-12 flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-8">
              纯图标版本
            </h3>
            <LogoIcon size={120} animated={animated} design={selectedDesign} />
          </div>
        </motion.div>

        {/* 尺寸展示 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-8 mb-12"
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            不同尺寸
          </h3>
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <Logo size="sm" animated={false} design={selectedDesign} />
              <span className="text-xs text-[var(--text-muted)]">Small (32px)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Logo size="md" animated={false} design={selectedDesign} />
              <span className="text-xs text-[var(--text-muted)]">Medium (40px)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Logo size="lg" animated={false} design={selectedDesign} />
              <span className="text-xs text-[var(--text-muted)]">Large (56px)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Logo size="xl" animated={false} design={selectedDesign} />
              <span className="text-xs text-[var(--text-muted)]">Extra Large (80px)</span>
            </div>
          </div>
        </motion.div>

        {/* 变体展示 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {/* 完整版 */}
          <div className="card p-6 flex flex-col items-center">
            <h4 className="text-sm font-medium text-[var(--text-muted)] mb-4">完整版</h4>
            <Logo size="lg" animated={false} variant="full" design={selectedDesign} />
          </div>

          {/* 图标版 */}
          <div className="card p-6 flex flex-col items-center">
            <h4 className="text-sm font-medium text-[var(--text-muted)] mb-4">图标版</h4>
            <Logo size="lg" animated={false} variant="icon" design={selectedDesign} />
          </div>

          {/* 文字版 */}
          <div className="card p-6 flex flex-col items-center">
            <h4 className="text-sm font-medium text-[var(--text-muted)] mb-4">文字版</h4>
            <Logo size="lg" animated={false} variant="wordmark" design={selectedDesign} />
          </div>
        </motion.div>

        {/* 加载状态 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-8 mb-12"
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            加载动画
          </h3>
          <div className="flex flex-wrap items-center gap-12">
            <div className="flex flex-col items-center gap-3">
              <LoadingLogo size={48} design={selectedDesign} />
              <span className="text-xs text-[var(--text-muted)]">Loading</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <LogoBadge design={selectedDesign} />
              <span className="text-xs text-[var(--text-muted)]">Badge</span>
            </div>
          </div>
        </motion.div>

        {/* 使用说明 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-8"
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            使用说明
          </h3>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-4 font-mono text-sm text-[var(--text-secondary)] overflow-x-auto">
            <pre>{`// 导入组件
import { Logo, LogoIcon, LoadingLogo, LogoBadge } from './components/brand/Logo';

// 使用完整 Logo（默认字母 Y 设计）
<Logo size="md" animated={true} />

// 使用汉字"杨"设计
<Logo design="yang-character" size="lg" />

// 使用小羊设计
<Logo design="sheep" size="xl" animated={true} />

// 仅图标
<LogoIcon size={64} design="y-letter" />

// 加载动画
<LoadingLogo size={48} design="sheep" />

// 徽章
<LogoBadge design="yang-character" />`}</pre>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LogoShowcase;
