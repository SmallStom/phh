import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  icon: Icon, 
  label, 
  value, 
  onClick 
}) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <Icon className="w-6 h-6 text-terracotta-500 mb-2" />
      <span className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {label}
      </span>
    </button>
  );
};
