import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  variant?: 'full' | 'icon' | 'wordmark';
  design?: 'y-letter' | 'yang-character' | 'sheep';
}

// 品牌 Logo 组件
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  animated = true,
  className = '',
  variant = 'full',
  design = 'y-letter',
}) => {
  const sizeMap = {
    sm: { container: 32, font: 14 },
    md: { container: 40, font: 18 },
    lg: { container: 56, font: 24 },
    xl: { container: 80, font: 32 },
  };

  const { container, font } = sizeMap[size];

  if (variant === 'icon') {
    return <LogoIcon size={container} animated={animated} design={design} className={className} />;
  }

  if (variant === 'wordmark') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span
          className="font-bold tracking-tight"
          style={{
            fontSize: font,
            color: 'var(--accent-color)',
            fontFamily: '"Noto Serif SC", serif',
          }}
        >
          美好广场
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon size={container} animated={animated} design={design} />
      <div className="flex flex-col">
        <span
          className="font-bold tracking-tight leading-none"
          style={{
            fontSize: font,
            color: 'var(--text-primary)',
            fontFamily: '"Noto Serif SC", serif',
          }}
        >
          美好广场
        </span>
        <span
          className="text-[10px] tracking-widest uppercase mt-0.5"
          style={{
            color: 'var(--text-muted)',
            fontFamily: '"Inter", sans-serif',
          }}
        >
          Beautiful Moments
        </span>
      </div>
    </div>
  );
};

// Logo 图标组件
interface LogoIconProps {
  size?: number;
  animated?: boolean;
  design?: 'y-letter' | 'yang-character' | 'sheep';
  className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  size = 40,
  animated = true,
  design = 'y-letter',
  className = '',
}) => {
  switch (design) {
    case 'yang-character':
      return <YangCharacterLogo size={size} animated={animated} className={className} />;
    case 'sheep':
      return <SheepLogo size={size} animated={animated} className={className} />;
    case 'y-letter':
    default:
      return <YLetterLogo size={size} animated={animated} className={className} />;
  }
};

// ========== 方案一：字母 Y 设计 ==========
// 设计概念：Y 字母 + 树枝分叉 + 向上生长的寓意
const YLetterLogo: React.FC<{ size: number; animated: boolean; className: string }> = ({
  size,
  animated,
  className,
}) => {
  const strokeWidth = size * 0.08;
  const center = size / 2;

  if (!animated) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={className}
        fill="none"
      >
        {/* 外圆环 */}
        <circle
          cx={center}
          cy={center}
          r={center - strokeWidth / 2}
          stroke="var(--accent-color)"
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.15}
        />

        {/* Y 字母主体 - 树枝风格 */}
        <g transform={`translate(${center}, ${center})`}>
          {/* 主干 */}
          <path
            d={`M 0 ${size * 0.22} L 0 ${-size * 0.08}`}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth * 1.2}
            strokeLinecap="round"
            fill="none"
          />
          {/* 左分支 */}
          <path
            d={`M 0 ${-size * 0.08} L ${-size * 0.18} ${-size * 0.22}`}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
          {/* 右分支 */}
          <path
            d={`M 0 ${-size * 0.08} L ${size * 0.18} ${-size * 0.22}`}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
          {/* 装饰性小叶子 */}
          <ellipse
            cx={-size * 0.22}
            cy={-size * 0.18}
            rx={size * 0.06}
            ry={size * 0.1}
            fill="var(--accent-color)"
            transform="rotate(-30)"
            opacity={0.8}
          />
          <ellipse
            cx={size * 0.22}
            cy={-size * 0.18}
            rx={size * 0.06}
            ry={size * 0.1}
            fill="var(--accent-color)"
            transform="rotate(30)"
            opacity={0.8}
          />
        </g>
      </svg>
    );
  }

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      fill="none"
      initial="hidden"
      animate="visible"
    >
      {/* 外圆环 */}
      <motion.circle
        cx={center}
        cy={center}
        r={center - strokeWidth / 2}
        stroke="var(--accent-color)"
        strokeWidth={strokeWidth}
        fill="none"
        opacity={0.15}
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 0.15,
            transition: {
              pathLength: { duration: 0.8, ease: 'easeInOut' },
              opacity: { duration: 0.3 },
            },
          },
        }}
      />

      {/* Y 字母动画 */}
      <motion.g
        transform={`translate(${center}, ${center})`}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { delay: 0.3 } },
        }}
      >
        {/* 主干 */}
        <motion.path
          d={`M 0 ${size * 0.22} L 0 ${-size * 0.08}`}
          stroke="var(--accent-color)"
          strokeWidth={strokeWidth * 1.2}
          strokeLinecap="round"
          fill="none"
          variants={{
            hidden: { pathLength: 0 },
            visible: {
              pathLength: 1,
              transition: { duration: 0.5, ease: 'easeInOut' },
            },
          }}
        />
        {/* 左分支 */}
        <motion.path
          d={`M 0 ${-size * 0.08} L ${-size * 0.18} ${-size * 0.22}`}
          stroke="var(--accent-color)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          variants={{
            hidden: { pathLength: 0 },
            visible: {
              pathLength: 1,
              transition: { duration: 0.4, ease: 'easeOut', delay: 0.4 },
            },
          }}
        />
        {/* 右分支 */}
        <motion.path
          d={`M 0 ${-size * 0.08} L ${size * 0.18} ${-size * 0.22}`}
          stroke="var(--accent-color)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          variants={{
            hidden: { pathLength: 0 },
            visible: {
              pathLength: 1,
              transition: { duration: 0.4, ease: 'easeOut', delay: 0.5 },
            },
          }}
        />
        {/* 叶子动画 */}
        <motion.ellipse
          cx={-size * 0.22}
          cy={-size * 0.18}
          rx={size * 0.06}
          ry={size * 0.1}
          fill="var(--accent-color)"
          transform="rotate(-30)"
          opacity={0.8}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.8 }}
          transition={{ delay: 0.8, duration: 0.3, ease: 'backOut' as const }}
        />
        <motion.ellipse
          cx={size * 0.22}
          cy={-size * 0.18}
          rx={size * 0.06}
          ry={size * 0.1}
          fill="var(--accent-color)"
          transform="rotate(30)"
          opacity={0.8}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.8 }}
          transition={{ delay: 0.9, duration: 0.3, ease: 'backOut' as const }}
        />
      </motion.g>
    </motion.svg>
  );
};

// ========== 方案二：汉字 杨 设计 ==========
// 设计概念：简化汉字"杨" + 木字旁 + 昜的抽象
const YangCharacterLogo: React.FC<{ size: number; animated: boolean; className: string }> = ({
  size,
  animated,
  className,
}) => {
  const strokeWidth = size * 0.07;
  const center = size / 2;

  if (!animated) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={className}
        fill="none"
      >
        {/* 背景圆 */}
        <circle
          cx={center}
          cy={center}
          r={center - strokeWidth}
          fill="var(--accent-color)"
          opacity={0.1}
        />

        {/* 简化汉字"杨" */}
        <g transform={`translate(${center}, ${center})`}>
          {/* 木字旁 - 竖 */}
          <path
            d={`M ${-size * 0.12} ${-size * 0.2} L ${-size * 0.12} ${size * 0.2}`}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth * 1.2}
            strokeLinecap="round"
          />
          {/* 木字旁 - 横 */}
          <path
            d={`M ${-size * 0.2} ${-size * 0.05} L ${-size * 0.04} ${-size * 0.05}`}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* 木字旁 - 撇 */}
          <path
            d={`M ${-size * 0.12} ${-size * 0.05} L ${-size * 0.2} ${size * 0.12}`}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth * 0.8}
            strokeLinecap="round"
          />
          {/* 木字旁 - 捺 */}
          <path
            d={`M ${-size * 0.12} ${size * 0.05} L ${-size * 0.04} ${size * 0.15}`}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth * 0.8}
            strokeLinecap="round"
          />

          {/* 昜部分 - 简化成日 + 三横 */}
          {/* 日字框 */}
          <rect
            x={-size * 0.02}
            y={-size * 0.15}
            width={size * 0.18}
            height={size * 0.14}
            rx={size * 0.02}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* 日字中间横 */}
          <path
            d={`M ${-size * 0.02} ${-size * 0.08} L ${size * 0.16} ${-size * 0.08}`}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth * 0.6}
            strokeLinecap="round"
          />
          {/* 下方三横 */}
          <path
            d={`M ${size * 0.02} ${size * 0.02} L ${size * 0.14} ${size * 0.02}`}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth * 0.7}
            strokeLinecap="round"
          />
          <path
            d={`M ${size * 0.02} ${size * 0.09} L ${size * 0.14} ${size * 0.09}`}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth * 0.7}
            strokeLinecap="round"
          />
          <path
            d={`M ${size * 0.02} ${size * 0.16} L ${size * 0.14} ${size * 0.16}`}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth * 0.7}
            strokeLinecap="round"
          />
        </g>
      </svg>
    );
  }

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      fill="none"
      initial="hidden"
      animate="visible"
    >
      {/* 背景圆 */}
      <motion.circle
        cx={center}
        cy={center}
        r={center - strokeWidth}
        fill="var(--accent-color)"
        opacity={0.1}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, ease: 'backOut' as const }}
      />

      {/* 汉字动画 */}
      <motion.g transform={`translate(${center}, ${center})`}>
        {/* 木字旁竖 */}
        <motion.path
          d={`M ${-size * 0.12} ${-size * 0.2} L ${-size * 0.12} ${size * 0.2}`}
          stroke="var(--accent-color)"
          strokeWidth={strokeWidth * 1.2}
          strokeLinecap="round"
          variants={{
            hidden: { pathLength: 0 },
            visible: { pathLength: 1, transition: { duration: 0.4, ease: 'easeInOut' } },
          }}
        />
        {/* 木字旁横 */}
        <motion.path
          d={`M ${-size * 0.2} ${-size * 0.05} L ${-size * 0.04} ${-size * 0.05}`}
          stroke="var(--accent-color)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          variants={{
            hidden: { pathLength: 0 },
            visible: { pathLength: 1, transition: { duration: 0.3, delay: 0.3, ease: 'easeOut' } },
          }}
        />
        {/* 木字旁撇 */}
        <motion.path
          d={`M ${-size * 0.12} ${-size * 0.05} L ${-size * 0.2} ${size * 0.12}`}
          stroke="var(--accent-color)"
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          variants={{
            hidden: { pathLength: 0 },
            visible: { pathLength: 1, transition: { duration: 0.25, delay: 0.4, ease: 'easeOut' } },
          }}
        />
        {/* 木字旁捺 */}
        <motion.path
          d={`M ${-size * 0.12} ${size * 0.05} L ${-size * 0.04} ${size * 0.15}`}
          stroke="var(--accent-color)"
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          variants={{
            hidden: { pathLength: 0 },
            visible: { pathLength: 1, transition: { duration: 0.25, delay: 0.45, ease: 'easeOut' } },
          }}
        />

        {/* 日字框 */}
        <motion.rect
          x={-size * 0.02}
          y={-size * 0.15}
          width={size * 0.18}
          height={size * 0.14}
          rx={size * 0.02}
          stroke="var(--accent-color)"
          strokeWidth={strokeWidth}
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5, ease: 'easeInOut' }}
        />
        {/* 日字横 */}
        <motion.path
          d={`M ${-size * 0.02} ${-size * 0.08} L ${size * 0.16} ${-size * 0.08}`}
          stroke="var(--accent-color)"
          strokeWidth={strokeWidth * 0.6}
          strokeLinecap="round"
          variants={{
            hidden: { pathLength: 0 },
            visible: { pathLength: 1, transition: { duration: 0.2, delay: 0.8, ease: 'easeOut' } },
          }}
        />
        {/* 下方三横 */}
        {[
          { y: size * 0.02, delay: 0.9 },
          { y: size * 0.09, delay: 1.0 },
          { y: size * 0.16, delay: 1.1 },
        ].map((item, i) => (
          <motion.path
            key={i}
            d={`M ${size * 0.02} ${item.y} L ${size * 0.14} ${item.y}`}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth * 0.7}
            strokeLinecap="round"
            variants={{
              hidden: { pathLength: 0 },
              visible: { pathLength: 1, transition: { duration: 0.2, delay: item.delay, ease: 'easeOut' } },
            }}
          />
        ))}
      </motion.g>
    </motion.svg>
  );
};

// ========== 方案三：羊 动物设计 ==========
// 设计概念：可爱小羊 + 卷角 + 圆润造型
const SheepLogo: React.FC<{ size: number; animated: boolean; className: string }> = ({
  size,
  animated,
  className,
}) => {
  const strokeWidth = size * 0.06;
  const center = size / 2;

  if (!animated) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={className}
        fill="none"
      >
        {/* 背景 */}
        <circle
          cx={center}
          cy={center}
          r={center - strokeWidth}
          fill="var(--accent-color)"
          opacity={0.08}
        />

        {/* 小羊 */}
        <g transform={`translate(${center}, ${center})`}>
          {/* 羊角 - 左 */}
          <path
            d={`M ${-size * 0.12} ${-size * 0.08} 
                Q ${-size * 0.2} ${-size * 0.18} ${-size * 0.08} ${-size * 0.22}
                Q ${-size * 0.02} ${-size * 0.18} ${-size * 0.04} ${-size * 0.1}`}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth * 1.2}
            strokeLinecap="round"
            fill="none"
          />
          {/* 羊角 - 右 */}
          <path
            d={`M ${size * 0.12} ${-size * 0.08} 
                Q ${size * 0.2} ${-size * 0.18} ${size * 0.08} ${-size * 0.22}
                Q ${size * 0.02} ${-size * 0.18} ${size * 0.04} ${-size * 0.1}`}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth * 1.2}
            strokeLinecap="round"
            fill="none"
          />

          {/* 羊头 - 圆形 */}
          <circle
            cx={0}
            cy={0}
            r={size * 0.18}
            fill="var(--accent-color)"
            opacity={0.15}
          />
          <circle
            cx={0}
            cy={0}
            r={size * 0.18}
            stroke="var(--accent-color)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* 眼睛 - 左 */}
          <circle
            cx={-size * 0.06}
            cy={-size * 0.02}
            r={size * 0.025}
            fill="var(--accent-color)"
          />
          {/* 眼睛 - 右 */}
          <circle
            cx={size * 0.06}
            cy={-size * 0.02}
            r={size * 0.025}
            fill="var(--accent-color)"
          />

          {/* 鼻子/嘴巴 */}
          <ellipse
            cx={0}
            cy={size * 0.06}
            rx={size * 0.04}
            ry={size * 0.025}
            fill="var(--accent-color)"
            opacity={0.6}
          />

          {/* 耳朵 - 左 */}
          <ellipse
            cx={-size * 0.22}
            cy={-size * 0.02}
            rx={size * 0.05}
            ry={size * 0.08}
            fill="var(--accent-color)"
            opacity={0.7}
            transform="rotate(-20)"
          />
          {/* 耳朵 - 右 */}
          <ellipse
            cx={size * 0.22}
            cy={-size * 0.02}
            rx={size * 0.05}
            ry={size * 0.08}
            fill="var(--accent-color)"
            opacity={0.7}
            transform="rotate(20)"
          />
        </g>
      </svg>
    );
  }

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      fill="none"
      initial="hidden"
      animate="visible"
    >
      {/* 背景圆 */}
      <motion.circle
        cx={center}
        cy={center}
        r={center - strokeWidth}
        fill="var(--accent-color)"
        opacity={0.08}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, ease: 'backOut' as const }}
      />

      {/* 小羊动画 */}
      <motion.g transform={`translate(${center}, ${center})`}>
        {/* 左角 */}
        <motion.path
          d={`M ${-size * 0.12} ${-size * 0.08} 
              Q ${-size * 0.2} ${-size * 0.18} ${-size * 0.08} ${-size * 0.22}
              Q ${-size * 0.02} ${-size * 0.18} ${-size * 0.04} ${-size * 0.1}`}
          stroke="var(--accent-color)"
          strokeWidth={strokeWidth * 1.2}
          strokeLinecap="round"
          fill="none"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: { pathLength: 1, opacity: 1, transition: { duration: 0.5, ease: 'easeInOut' } },
          }}
        />
        {/* 右角 */}
        <motion.path
          d={`M ${size * 0.12} ${-size * 0.08} 
              Q ${size * 0.2} ${-size * 0.18} ${size * 0.08} ${-size * 0.22}
              Q ${size * 0.02} ${-size * 0.18} ${size * 0.04} ${-size * 0.1}`}
          stroke="var(--accent-color)"
          strokeWidth={strokeWidth * 1.2}
          strokeLinecap="round"
          fill="none"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: { pathLength: 1, opacity: 1, transition: { duration: 0.5, delay: 0.1, ease: 'easeInOut' } },
          }}
        />

        {/* 羊头 */}
        <motion.circle
          cx={0}
          cy={0}
          r={size * 0.18}
          fill="var(--accent-color)"
          opacity={0.15}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3, ease: 'backOut' as const }}
        />
        <motion.circle
          cx={0}
          cy={0}
          r={size * 0.18}
          stroke="var(--accent-color)"
          strokeWidth={strokeWidth}
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 0.4, ease: 'easeOut' }}
        />

        {/* 眼睛 */}
        <motion.circle
          cx={-size * 0.06}
          cy={-size * 0.02}
          r={size * 0.025}
          fill="var(--accent-color)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.7, duration: 0.2, ease: 'backOut' as const }}
        />
        <motion.circle
          cx={size * 0.06}
          cy={-size * 0.02}
          r={size * 0.025}
          fill="var(--accent-color)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.75, duration: 0.2, ease: 'backOut' as const }}
        />

        {/* 眨眼动画 */}
        <motion.g
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ delay: 2, duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
        >
          <circle cx={-size * 0.06} cy={-size * 0.02} r={size * 0.025} fill="var(--accent-color)" />
          <circle cx={size * 0.06} cy={-size * 0.02} r={size * 0.025} fill="var(--accent-color)" />
        </motion.g>

        {/* 鼻子 */}
        <motion.ellipse
          cx={0}
          cy={size * 0.06}
          rx={size * 0.04}
          ry={size * 0.025}
          fill="var(--accent-color)"
          opacity={0.6}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.9, duration: 0.2, ease: 'backOut' as const }}
        />

        {/* 耳朵 */}
        <motion.ellipse
          cx={-size * 0.22}
          cy={-size * 0.02}
          rx={size * 0.05}
          ry={size * 0.08}
          fill="var(--accent-color)"
          opacity={0.7}
          transform="rotate(-20)"
          initial={{ scale: 0, x: 10 }}
          animate={{ scale: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.3, ease: 'backOut' as const }}
        />
        <motion.ellipse
          cx={size * 0.22}
          cy={-size * 0.02}
          rx={size * 0.05}
          ry={size * 0.08}
          fill="var(--accent-color)"
          opacity={0.7}
          transform="rotate(20)"
          initial={{ scale: 0, x: -10 }}
          animate={{ scale: 1, x: 0 }}
          transition={{ delay: 0.55, duration: 0.3, ease: 'backOut' as const }}
        />
      </motion.g>
    </motion.svg>
  );
};

// ========== 加载动画 Logo ==========
export const LoadingLogo: React.FC<{ size?: number; className?: string; design?: 'y-letter' | 'yang-character' | 'sheep' }> = ({
  size = 48,
  className = '',
  design = 'y-letter',
}) => {
  return (
    <motion.div
      className={className}
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    >
      <LogoIcon size={size} animated={false} design={design} />
    </motion.div>
  );
};

// ========== Logo 徽章 ==========
export const LogoBadge: React.FC<{ className?: string; design?: 'y-letter' | 'yang-character' | 'sheep' }> = ({
  className = '',
  design = 'y-letter',
}) => (
  <div
    className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${className}`}
    style={{
      background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))',
    }}
  >
    <LogoIcon size={16} animated={false} design={design} className="[&_path]:stroke-white [&_circle]:stroke-white [&_ellipse]:fill-white" />
  </div>
);

export default Logo;
