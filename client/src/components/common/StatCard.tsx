import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  comparisonText?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    comparisonPeriod?: string;
  };
  colorScheme?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
  onClick?: () => void;
  className?: string;
}

const colorMaps = {
  blue: {
    iconBg: 'bg-blue-600 text-white shadow-xs',
  },
  indigo: {
    iconBg: 'bg-indigo-600 text-white shadow-xs',
  },
  emerald: {
    iconBg: 'bg-emerald-500 text-white shadow-xs',
  },
  amber: {
    iconBg: 'bg-amber-500 text-white shadow-xs',
  },
  rose: {
    iconBg: 'bg-rose-500 text-white shadow-xs',
  },
  purple: {
    iconBg: 'bg-purple-600 text-white shadow-xs',
  },
  slate: {
    iconBg: 'bg-slate-700 text-white shadow-xs',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  comparisonText,
  colorScheme = 'blue',
  onClick,
  className = '',
}) => {
  const conf = colorMaps[colorScheme] || colorMaps.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm active:scale-[0.99]' : ''
      } ${className}`}
    >
      {/* Top Section with Icon and Numbers */}
      <div className="flex items-start gap-4">
        {/* Left: Square Icon Badge */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${conf.iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Right: Title & Big Stat Value */}
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
            {title}
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {value}
          </p>
        </div>
      </div>

      {/* Bottom Trend & Comparison Row */}
      {(trend || comparisonText || subtitle) && (
        <div className="mt-4 pt-2 flex items-center gap-1.5 text-xs">
          {trend ? (
            <span
              className={`inline-flex items-center gap-1 font-bold ${
                trend.isPositive !== false
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.isPositive !== false ? (
                <span>&uarr;</span>
              ) : (
                <span>&darr;</span>
              )}
              <span>{trend.value}</span>
              <span className="font-normal text-slate-400 dark:text-slate-500">
                {trend.comparisonPeriod || 'vs Apr 18 &ndash; May 17, 2025'}
              </span>
            </span>
          ) : comparisonText ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span>&uarr;</span> {comparisonText}
            </span>
          ) : subtitle ? (
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium truncate">
              {subtitle}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
};
