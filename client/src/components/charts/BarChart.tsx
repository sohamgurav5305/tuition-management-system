import React, { useState } from 'react';

export interface BarDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  maxValue?: number;
  color?: string;
  subLabel?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  title?: string;
  subtitle?: string;
  orientation?: 'vertical' | 'horizontal';
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  showCapacity?: boolean;
  colorScheme?: 'blue' | 'indigo' | 'emerald' | 'purple' | 'amber';
}

const BAR_SCHEMES: Record<string, { fill: string; fillHover: string; secondary: string }> = {
  blue: { fill: 'bg-blue-600 dark:bg-blue-500', fillHover: 'bg-blue-500 dark:bg-blue-400', secondary: 'bg-blue-200 dark:bg-blue-900' },
  indigo: { fill: 'bg-indigo-600 dark:bg-indigo-500', fillHover: 'bg-indigo-500 dark:bg-indigo-400', secondary: 'bg-indigo-200 dark:bg-indigo-900' },
  emerald: { fill: 'bg-emerald-600 dark:bg-emerald-500', fillHover: 'bg-emerald-500 dark:bg-emerald-400', secondary: 'bg-emerald-200 dark:bg-emerald-900' },
  purple: { fill: 'bg-purple-600 dark:bg-purple-500', fillHover: 'bg-purple-500 dark:bg-purple-400', secondary: 'bg-purple-200 dark:bg-purple-900' },
  amber: { fill: 'bg-amber-600 dark:bg-amber-500', fillHover: 'bg-amber-500 dark:bg-amber-400', secondary: 'bg-amber-200 dark:bg-amber-900' },
};

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  subtitle,
  orientation = 'vertical',
  height = 220,
  valuePrefix = '',
  valueSuffix = '',
  showCapacity = false,
  colorScheme = 'blue',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const scheme = BAR_SCHEMES[colorScheme] || BAR_SCHEMES.blue;

  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center">
        <p className="text-xs text-slate-400">No chart data available</p>
      </div>
    );
  }

  // Calculate highest value for relative percentage scaling
  const maxBarValue = Math.max(
    ...data.map((d) => (showCapacity && d.maxValue ? Math.max(d.value, d.maxValue) : d.value)),
    1
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between">
      {/* Title Header */}
      <div className="mb-4">
        {title && (
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>{title}</span>
            {hoveredIndex !== null && (
              <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">
                {valuePrefix}
                {data[hoveredIndex].value.toLocaleString()}
                {valueSuffix}
                {data[hoveredIndex].subLabel ? ` (${data[hoveredIndex].subLabel})` : ''}
              </span>
            )}
          </h4>
        )}
        {subtitle && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Horizontal Bar Mode */}
      {orientation === 'horizontal' ? (
        <div className="space-y-3 py-1">
          {data.map((item, idx) => {
            const isHovered = hoveredIndex === idx;
            const pct = Math.min(100, Math.round((item.value / maxBarValue) * 100));
            const capacityPct = item.maxValue ? Math.min(100, Math.round((item.value / item.maxValue) * 100)) : null;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="group cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {valuePrefix}{item.value.toLocaleString()}{valueSuffix}
                    </span>
                    {item.maxValue && (
                      <span className="text-slate-400">/ {item.maxValue} max</span>
                    )}
                  </div>
                </div>

                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isHovered ? scheme.fillHover : scheme.fill
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vertical Bar Mode */
        <div
          className="flex items-end justify-between gap-2 pt-4 pb-1 select-none"
          style={{ height: `${height}px` }}
        >
          {data.map((item, idx) => {
            const isHovered = hoveredIndex === idx;
            const heightPct = Math.max(8, Math.round((item.value / maxBarValue) * 100));

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              >
                {/* Value on Hover tooltip pill */}
                <div
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 mb-1.5 transition-all transform ${
                    isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
                  }`}
                >
                  {valuePrefix}{item.value.toLocaleString()}{valueSuffix}
                </div>

                {/* Vertical Bar Cylinder */}
                <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800/80 rounded-t-xl overflow-hidden h-full flex flex-col justify-end">
                  <div
                    className={`w-full rounded-t-xl transition-all duration-500 ease-out ${
                      isHovered ? scheme.fillHover : scheme.fill
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>

                {/* Bottom Label */}
                <span
                  className={`text-[10px] font-mono mt-2 truncate max-w-full transition-colors ${
                    isHovered
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
