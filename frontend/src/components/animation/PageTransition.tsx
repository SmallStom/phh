import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

// 页面切换动画组件
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    out: {
      opacity: 0,
      y: -20,
      scale: 0.98,
    },
  };

  const pageTransition = {
    type: 'tween' as const,
    ease: [0.25, 0.1, 0.25, 1] as const,
    duration: 0.35,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// 带 stagger 效果的列表动画
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = '',
  staggerDelay = 0.08,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 列表项动画
interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = '',
}) => {
  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95,
    },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
        mass: 0.8,
      },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 淡入动画
interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.5,
  direction = 'up',
}) => {
  const directionOffset = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 30 },
    right: { x: -30 },
    none: {},
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directionOffset[direction],
      }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0,
      }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1] as const,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 卡片悬停动画
interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
  y?: number;
}

export const HoverCard: React.FC<HoverCardProps> = ({
  children,
  className = '',
  scale = 1.02,
  y = -4,
}) => {
  return (
    <motion.div
      whileHover={{ 
        scale,
        y,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 25,
        },
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 按钮点击动画
interface AnimatedButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className = '',
  onClick,
  disabled = false,
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      whileFocus={{ scale: disabled ? 1 : 1.02 }}
      onClick={onClick}
      disabled={disabled}
      className={className}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
      }}
    >
      {children}
    </motion.button>
  );
};

// 滚动显示动画
interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  threshold = 0.1,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: threshold }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1] as const,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 波纹效果容器
interface RippleProps {
  children: React.ReactNode;
  className?: string;
}

export const RippleContainer: React.FC<RippleProps> = ({
  children,
  className = '',
}) => {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      whileTap={{
        scale: 0.98,
      }}
    >
      {children}
    </motion.div>
  );
};

// 脉冲动画（用于通知徽章等）
interface PulseProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  className = '',
  color = 'var(--accent-color)',
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      <motion.span
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.7, 0, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

// 数字滚动动画
interface CountUpProps {
  end: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  end,
  className = '',
  suffix = '',
}) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
      >
        {end}{suffix}
      </motion.span>
    </motion.span>
  );
};

export default PageTransition;
