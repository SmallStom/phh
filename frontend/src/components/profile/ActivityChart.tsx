import React from 'react';
import { motion } from 'framer-motion';

interface ActivityData {
  date: string;
  count: number;
}

interface ActivityChartProps {
  data: ActivityData[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
  const totalContributions = data.reduce((sum, d) => sum + d.count, 0);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count <= 2) return 'bg-terracotta-200';
    if (count <= 4) return 'bg-terracotta-300';
    if (count <= 6) return 'bg-terracotta-400';
    return 'bg-terracotta-500';
  };

  const getTooltipText = (date: string, count: number) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
    return `${formattedDate}: ${count} 条记录`;
  };

  // 将数据分组为周
  const weeks: ActivityData[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <div className="space-y-4">
      {/* 统计信息 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          过去 30 天共创作 <span className="font-semibold text-terracotta-600">{totalContributions}</span> 条记录
        </span>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">少</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
            <div className="w-3 h-3 bg-terracotta-200 rounded-sm"></div>
            <div className="w-3 h-3 bg-terracotta-300 rounded-sm"></div>
            <div className="w-3 h-3 bg-terracotta-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-terracotta-500 rounded-sm"></div>
          </div>
          <span className="text-gray-400 text-xs">多</span>
        </div>
      </div>

      {/* 图表 */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={day.date}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                  className={`w-3 h-3 rounded-sm ${getColor(day.count)} cursor-pointer hover:ring-2 hover:ring-terracotta-300 transition-all`}
                  title={getTooltipText(day.date, day.count)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 月份标签 */}
      <div className="flex justify-between text-xs text-gray-400">
        {Array.from(new Set(data.map(d => {
          const date = new Date(d.date);
          return date.getMonth();
        }))).map(month => (
          <span key={month}>
            {new Date(2024, month).toLocaleDateString('zh-CN', { month: 'short' })}
          </span>
        ))}
      </div>
    </div>
  );
};
