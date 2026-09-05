import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  colorScheme?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
  onClick?: () => void;
  className?: string;
}

const colorMaps = {
  blue: {
    iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
  },
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
  },
  purple: {
    iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
  },
  slate: {
    iconBg: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'blue',
  onClick,
  className = '',
}) => {
  const conf = colorMaps[colorScheme] || colorMaps.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm active:scale-[0.99]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 truncate tracking-normal">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${conf.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <p className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
          {value}
        </p>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ml-auto flex-shrink-0 ${
                trend.isPositive
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
