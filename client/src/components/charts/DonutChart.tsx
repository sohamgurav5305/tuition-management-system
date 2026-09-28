import React, { useState } from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  subText?: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  title?: string;
  subtitle?: string;
  centerMetric?: string | number;
  centerLabel?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  title,
  subtitle,
  centerMetric,
  centerLabel,
  valuePrefix = '',
  valueSuffix = '',
  size = 180,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  const calculatedSegments = segments.map((s, idx) => {
    const percentage = s.value / total;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += percentage * circumference;

    return {
      ...s,
      percentage: Math.round(percentage * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSegment = hoveredIndex !== null ? calculatedSegments[hoveredIndex] : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between">
      {/* Title */}
      <div className="mb-3">
        {title && (
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>{title}</span>
            {activeSegment && (
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                {activeSegment.label}: {activeSegment.percentage}%
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

      {/* Donut Graphic & Legend Row */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto py-2">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            {/* Background Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="14"
              className="text-slate-100 dark:text-slate-800/80"
            />

            {/* Colored Segments */}
            {calculatedSegments.map((s, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <circle
                  key={idx}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={s.color}
                  strokeWidth={isHovered ? 18 : 14}
                  strokeDasharray={s.strokeDasharray}
                  strokeDashoffset={s.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Centered Stat Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-none tabular-nums">
              {activeSegment ? `${activeSegment.percentage}%` : centerMetric ?? `${total.toLocaleString()}`}
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1 max-w-[80px] truncate">
              {activeSegment ? activeSegment.label : centerLabel ?? 'Total'}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="space-y-2.5 w-full sm:w-auto flex-1 max-w-[200px]">
          {calculatedSegments.map((s, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between gap-3 p-1.5 rounded-xl cursor-pointer transition-colors ${
                  isHovered ? 'bg-slate-100/80 dark:bg-slate-800/80' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 transition-transform"
                    style={{ backgroundColor: s.color, transform: isHovered ? 'scale(1.2)' : 'scale(1)' }}
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {s.label}
                  </span>
                </div>
                <div className="text-right flex-shrink-0 font-mono text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {valuePrefix}{s.value.toLocaleString()}{valueSuffix}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">({s.percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
