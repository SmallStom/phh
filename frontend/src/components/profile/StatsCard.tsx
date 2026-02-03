import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface Stat {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
}

interface StatsCardProps {
  title: string;
  icon: LucideIcon;
  stats: Stat[];
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendColors = {
  up: 'text-green-500',
  down: 'text-red-500',
  neutral: 'text-gray-400',
};

export const StatsCard: React.FC<StatsCardProps> = ({ title, icon: Icon, stats }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-terracotta-100 rounded-lg">
          <Icon className="w-5 h-5 text-terracotta-600" />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="space-y-4">
        {stats.map((stat, index) => {
          const TrendIcon = trendIcons[stat.trend];
          return (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{stat.value}</span>
                <TrendIcon className={`w-4 h-4 ${trendColors[stat.trend]}`} />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
