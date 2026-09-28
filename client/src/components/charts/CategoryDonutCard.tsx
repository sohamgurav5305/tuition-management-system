import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export interface CategorySegment {
  label: string;
  count: number;
  color: string;
}

interface CategoryDonutCardProps {
  title?: string;
  viewAllLink?: string;
  segments?: CategorySegment[];
  centerCount?: number | string;
  centerLabel?: string;
}

const DEFAULT_SEGMENTS: CategorySegment[] = [
  { label: 'JEE Advanced', count: 42, color: '#2563eb' }, // Blue
  { label: 'NEET Droppers', count: 38, color: '#10b981' }, // Emerald
  { label: 'Foundation 10th', count: 24, color: '#06b6d4' }, // Cyan
  { label: 'Olympiad Rankers', count: 12, color: '#f59e0b' }, // Amber
  { label: 'Crash Revision', count: 8, color: '#8b5cf6' }, // Purple
];

export const CategoryDonutCard: React.FC<CategoryDonutCardProps> = ({
  title = 'Enrolled Learners by Course',
  viewAllLink = '/courses',
  segments = DEFAULT_SEGMENTS,
  centerCount = 124,
  centerLabel = 'Enrolled',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = segments.reduce((sum, seg) => sum + seg.count, 0) || 1;

  // Donut SVG parameters
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate segment stroke dashes
  let cumulativePercent = 0;
  const chartSegments = segments.map((seg, idx) => {
    const percent = (seg.count / total) * 100;
    const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += percent;
    return {
      ...seg,
      percent,
      strokeDasharray,
      strokeDashoffset,
      idx,
    };
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All
          </Link>
        )}
      </div>

      {/* Donut and Legend Layout */}
      <div className="flex items-center justify-between gap-4 my-auto">
        {/* Left: SVG Donut */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth={strokeWidth}
            />

            {/* Segments */}
            {chartSegments.map((seg) => {
              const isHovered = hoveredIdx === seg.idx;
              return (
                <circle
                  key={seg.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(seg.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center Metric Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
              {hoveredIdx !== null ? segments[hoveredIdx].count : centerCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
              {hoveredIdx !== null ? segments[hoveredIdx].label : centerLabel}
            </span>
          </div>
        </div>

        {/* Right: Category List Legend */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {segments.map((seg, idx) => {
            const pct = ((seg.count / total) * 100).toFixed(1);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={seg.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between text-xs py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
                  isHovered ? 'bg-slate-100 dark:bg-slate-800/80 font-bold' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="truncate text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                    {seg.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 text-right">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                    {seg.count}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    ({pct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
