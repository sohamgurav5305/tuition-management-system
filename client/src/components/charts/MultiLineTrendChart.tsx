import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface TrendDataPoint {
  date: string;
  passRate: number; // 0 - 100 (%)
  firstPassYield: number; // 0 - 100 (%)
  nonconformities: number; // 0 - 40 count
}

interface MultiLineTrendChartProps {
  title?: string;
  data?: TrendDataPoint[];
  selectedRange?: string;
  onRangeChange?: (range: string) => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  tertiaryLabel?: string;
}

const DEFAULT_DATA: TrendDataPoint[] = [
  { date: 'May 18', passRate: 92, firstPassYield: 88, nonconformities: 12 },
  { date: 'May 22', passRate: 94, firstPassYield: 89, nonconformities: 10 },
  { date: 'May 25', passRate: 91, firstPassYield: 92, nonconformities: 15 },
  { date: 'May 29', passRate: 95, firstPassYield: 90, nonconformities: 8 },
  { date: 'Jun 1', passRate: 96, firstPassYield: 94, nonconformities: 11 },
  { date: 'Jun 5', passRate: 93, firstPassYield: 91, nonconformities: 9 },
  { date: 'Jun 8', passRate: 97, firstPassYield: 95, nonconformities: 6 },
  { date: 'Jun 12', passRate: 96, firstPassYield: 94, nonconformities: 8 },
  { date: 'Jun 16', passRate: 98, firstPassYield: 96, nonconformities: 5 },
];

export const MultiLineTrendChart: React.FC<MultiLineTrendChartProps> = ({
  title = 'Academic & Fee Performance Trend',
  data = DEFAULT_DATA,
  selectedRange = 'Last 30 Days',
  onRangeChange,
  primaryLabel = 'Fee Realization (%)',
  secondaryLabel = 'Attendance Rate (%)',
  tertiaryLabel = 'Pending Dues (₹k)',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [range, setRange] = useState(selectedRange);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const ranges = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Year'];

  const width = 680;
  const height = 240;
  const padding = { top: 20, right: 35, bottom: 35, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // X coordinate calculation
  const getX = (idx: number) => {
    if (data.length <= 1) return padding.left;
    return padding.left + (idx / (data.length - 1)) * chartWidth;
  };

  // Y for left axis (0 to 100%)
  const getYPercent = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    return padding.top + chartHeight - (clamped / 100) * chartHeight;
  };

  // Y for right axis (0 to 40 count)
  const getYCount = (val: number) => {
    const maxCount = 40;
    const clamped = Math.max(0, Math.min(maxCount, val));
    return padding.top + chartHeight - (clamped / maxCount) * chartHeight;
  };

  // Generate SVG path for a line
  const createPath = (getYFunc: (val: number) => number, key: keyof TrendDataPoint) => {
    if (!data.length) return '';
    return data.reduce((acc, curr, idx) => {
      const x = getX(idx);
      const y = getYFunc(Number(curr[key]));
      if (idx === 0) return `M ${x},${y}`;
      // Smooth curve with cubic Bezier
      const prevX = getX(idx - 1);
      const prevY = getYFunc(Number(data[idx - 1][key]));
      const cpX1 = prevX + (x - prevX) / 2;
      const cpX2 = prevX + (x - prevX) / 2;
      return `${acc} C ${cpX1},${prevY} ${cpX2},${y} ${x},${y}`;
    }, '');
  };

  const passRatePath = createPath(getYPercent, 'passRate');
  const firstPassPath = createPath(getYPercent, 'firstPassYield');
  const nonconformitiesPath = createPath(getYCount, 'nonconformities');

  // Left Y Grid values (0%, 25%, 50%, 75%, 100%)
  const yGridTicks = [0, 25, 50, 75, 100];
  const rightGridTicks = [0, 10, 20, 30, 40];

  const handleSelectRange = (r: string) => {
    setRange(r);
    setDropdownOpen(false);
    if (onRangeChange) onRangeChange(r);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors flex flex-col justify-between">
      {/* Header & Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
        </div>

        {/* Range Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs"
          >
            <span>{range}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-30 animate-fadeIn">
              {ranges.map((r) => (
                <button
                  key={r}
                  onClick={() => handleSelectRange(r)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                    range === r
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-blue-600 rounded-full inline-block" />
          <span className="w-2 h-2 rounded-full bg-blue-600 -ml-2.5 inline-block" />
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{primaryLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-500 rounded-full inline-block" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-2.5 inline-block" />
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{secondaryLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-rose-500 rounded-full inline-block" />
          <span className="w-2 h-2 rounded-full bg-rose-500 -ml-2.5 inline-block" />
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{tertiaryLabel}</span>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div className="relative w-full overflow-hidden" style={{ height: '220px' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Horizontal Grid lines */}
          {yGridTicks.map((tick, i) => {
            const y = getYPercent(tick);
            return (
              <g key={`grid-${tick}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="1"
                  strokeDasharray={tick === 0 ? 'none' : '3 3'}
                />
                {/* Left Y Labels (0%, 25%, 50%, 75%, 100%) */}
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                >
                  {tick}%
                </text>
                {/* Right Y Labels (0, 10, 20, 30, 40) */}
                <text
                  x={width - padding.right + 8}
                  y={y + 4}
                  textAnchor="start"
                  className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                >
                  {rightGridTicks[i]}
                </text>
              </g>
            );
          })}

          {/* Lines */}
          <path
            d={passRatePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={firstPassPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={nonconformitiesPath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots on Data Points */}
          {data.map((d, idx) => {
            const x = getX(idx);
            const yPass = getYPercent(d.passRate);
            const yFirst = getYPercent(d.firstPassYield);
            const yNon = getYCount(d.nonconformities);
            const isHovered = hoveredIndex === idx;

            return (
              <g key={`dots-${idx}`}>
                {/* Blue dot */}
                <circle
                  cx={x}
                  cy={yPass}
                  r={isHovered ? 5 : 3}
                  fill="#ffffff"
                  stroke="#2563eb"
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150"
                />
                {/* Green dot */}
                <circle
                  cx={x}
                  cy={yFirst}
                  r={isHovered ? 5 : 3}
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150"
                />
                {/* Red dot */}
                <circle
                  cx={x}
                  cy={yNon}
                  r={isHovered ? 5 : 3}
                  fill="#ffffff"
                  stroke="#f43f5e"
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* Hover Crosshair */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={padding.top}
              x2={getX(hoveredIndex)}
              y2={height - padding.bottom}
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="pointer-events-none"
            />
          )}

          {/* X Axis Date Labels */}
          {data.map((d, idx) => {
            // Render every 2nd or key labels to avoid crowding
            if (idx % 2 === 0 || idx === data.length - 1) {
              return (
                <text
                  key={`xlabel-${idx}`}
                  x={getX(idx)}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 dark:fill-slate-400 font-medium"
                >
                  {d.date}
                </text>
              );
            }
            return null;
          })}

          {/* Transparent Hover Hit Boxes */}
          {data.map((_, idx) => {
            const x = getX(idx);
            const boxWidth = chartWidth / data.length;
            return (
              <rect
                key={`hit-${idx}`}
                x={x - boxWidth / 2}
                y={padding.top}
                width={boxWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute pointer-events-none bg-slate-900/95 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700/80 transform -translate-x-1/2 -translate-y-full z-20 whitespace-nowrap backdrop-blur-xs animate-fadeIn"
            style={{
              left: `${(getX(hoveredIndex) / width) * 100}%`,
              top: `${(Math.min(getYPercent(data[hoveredIndex].passRate), getYPercent(data[hoveredIndex].firstPassYield)) / height) * 100 - 4}%`,
            }}
          >
            <div className="font-bold text-slate-300 border-b border-slate-700 pb-1 mb-1">
              {data[hoveredIndex].date}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-blue-400 font-semibold">{primaryLabel}:</span>
                <span className="font-bold">{data[hoveredIndex].passRate}%</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-emerald-400 font-semibold">{secondaryLabel}:</span>
                <span className="font-bold">{data[hoveredIndex].firstPassYield}%</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-rose-400 font-semibold">{tertiaryLabel}:</span>
                <span className="font-bold">{data[hoveredIndex].nonconformities}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
