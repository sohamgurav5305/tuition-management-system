import React, { useState } from 'react';

export interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  tooltipText?: string;
}

interface AreaTrendChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  colorScheme?: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'indigo';
  valuePrefix?: string;
  valueSuffix?: string;
  timeRanges?: string[];
  activeRange?: string;
  onRangeChange?: (range: string) => void;
  showSecondary?: boolean;
  secondaryLabel?: string;
  primaryLabel?: string;
}

const SCHEME_COLORS: Record<
  string,
  {
    stroke: string;
    fillStart: string;
    fillEnd: string;
    dot: string;
    badge: string;
    secondaryStroke: string;
  }
> = {
  blue: {
    stroke: '#3b82f6',
    fillStart: 'rgba(59, 130, 246, 0.35)',
    fillEnd: 'rgba(59, 130, 246, 0.02)',
    dot: '#2563eb',
    badge: 'bg-blue-500',
    secondaryStroke: '#93c5fd',
  },
  emerald: {
    stroke: '#10b981',
    fillStart: 'rgba(16, 185, 129, 0.35)',
    fillEnd: 'rgba(16, 185, 129, 0.02)',
    dot: '#059669',
    badge: 'bg-emerald-500',
    secondaryStroke: '#a7f3d0',
  },
  purple: {
    stroke: '#8b5cf6',
    fillStart: 'rgba(139, 92, 246, 0.35)',
    fillEnd: 'rgba(139, 92, 246, 0.02)',
    dot: '#7c3aed',
    badge: 'bg-purple-500',
    secondaryStroke: '#c4b5fd',
  },
  indigo: {
    stroke: '#6366f1',
    fillStart: 'rgba(99, 102, 241, 0.35)',
    fillEnd: 'rgba(99, 102, 241, 0.02)',
    dot: '#4f46e5',
    badge: 'bg-indigo-500',
    secondaryStroke: '#a5b4fc',
  },
  amber: {
    stroke: '#f59e0b',
    fillStart: 'rgba(245, 158, 11, 0.35)',
    fillEnd: 'rgba(245, 158, 11, 0.02)',
    dot: '#d97706',
    badge: 'bg-amber-500',
    secondaryStroke: '#fde68a',
  },
  rose: {
    stroke: '#f43f5e',
    fillStart: 'rgba(244, 63, 94, 0.35)',
    fillEnd: 'rgba(244, 63, 94, 0.02)',
    dot: '#e11d48',
    badge: 'bg-rose-500',
    secondaryStroke: '#fecdd3',
  },
};

export const AreaTrendChart: React.FC<AreaTrendChartProps> = ({
  data,
  title,
  subtitle,
  height = 220,
  colorScheme = 'blue',
  valuePrefix = '',
  valueSuffix = '',
  timeRanges = ['7D', '30D', '6M', '1Y'],
  activeRange = '30D',
  onRangeChange,
  showSecondary = false,
  primaryLabel = 'Collection',
  secondaryLabel = 'Target Demand',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedRange, setSelectedRange] = useState(activeRange);

  const colors = SCHEME_COLORS[colorScheme] || SCHEME_COLORS.blue;

  const handleRangeClick = (r: string) => {
    setSelectedRange(r);
    if (onRangeChange) onRangeChange(r);
  };

  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center">
        <p className="text-xs text-slate-400">No chart data available</p>
      </div>
    );
  }

  // Calculate scaling
  const allValues = data.flatMap((d) =>
    showSecondary && d.secondaryValue !== undefined ? [d.value, d.secondaryValue] : [d.value]
  );
  const rawMax = Math.max(...allValues, 1);
  const rawMin = Math.min(...allValues, 0);
  const padding = (rawMax - rawMin) * 0.15 || 5;
  const maxValue = rawMax + padding;
  const minValue = Math.max(0, rawMin - padding);
  const valueRange = maxValue - minValue || 1;

  const svgWidth = 600;
  const svgHeight = height;
  const paddingLeft = 10;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 28;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const normalized = (val - minValue) / valueRange;
    return paddingTop + chartHeight - normalized * chartHeight;
  };

  // Build SVG Path with smooth curves
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));
  
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = createSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  // Secondary line if enabled
  const secondaryPoints = showSecondary
    ? data.map((d, i) => ({ x: getX(i), y: getY(d.secondaryValue || 0) }))
    : [];
  const secondaryLinePath = showSecondary ? createSmoothPath(secondaryPoints) : '';

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1];
  const activeX = hoveredIndex !== null ? getX(hoveredIndex) : getX(data.length - 1);
  const activeY = hoveredIndex !== null ? getY(activePoint.value) : getY(activePoint.value);

  // Gradient ID
  const gradientId = `area-grad-${colorScheme}-${Math.random().toString(36).substr(2, 5)}`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between">
      {/* Header with Title & Range Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          {title && (
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${colors.badge}`} />
              {title}
            </h4>
          )}
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
          {timeRanges.map((r) => (
            <button
              key={r}
              onClick={() => handleRangeClick(r)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                selectedRange === r
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Active Hover Value Banner */}
      <div className="flex items-baseline gap-3 mb-2 px-1">
        <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
          {valuePrefix}
          {activePoint.value.toLocaleString()}
          {valueSuffix}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          {activePoint.label} {activePoint.tooltipText ? `• ${activePoint.tooltipText}` : ''}
        </span>
        {showSecondary && activePoint.secondaryValue !== undefined && (
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto font-mono">
            {secondaryLabel}: {valuePrefix}{activePoint.secondaryValue.toLocaleString()}
          </span>
        )}
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.32" />
              <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight * 0.25}
            x2={svgWidth - paddingRight}
            y2={paddingTop + chartHeight * 0.25}
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight * 0.75}
            x2={svgWidth - paddingRight}
            y2={paddingTop + chartHeight * 0.75}
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Secondary Target Line */}
          {showSecondary && (
            <path
              d={secondaryLinePath}
              fill="none"
              stroke={colors.secondaryStroke}
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* Primary Trend Line */}
          <path
            d={linePath}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Hover Crosshair */}
          {hoveredIndex !== null && (
            <>
              <line
                x1={activeX}
                y1={paddingTop}
                x2={activeX}
                y2={paddingTop + chartHeight}
                className="stroke-slate-300 dark:stroke-slate-700"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={activeX}
                cy={activeY}
                r="6"
                fill={colors.stroke}
                className="animate-pulse ring-4 ring-blue-500/20"
              />
              <circle cx={activeX} cy={activeY} r="3" fill="#ffffff" />
            </>
          )}

          {/* X Axis Label Points */}
          {data.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIndex === i;
            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onTouchStart={() => setHoveredIndex(i)}
              >
                {/* Transparent wider touch capture rectangle */}
                <rect
                  x={x - chartWidth / (data.length * 2)}
                  y={0}
                  width={chartWidth / data.length}
                  height={svgHeight}
                  fill="transparent"
                />

                {/* Visible X Axis Labels */}
                <text
                  x={x}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  className={`text-[10px] font-mono transition-colors ${
                    isHovered
                      ? 'fill-blue-600 dark:fill-blue-400 font-bold'
                      : 'fill-slate-400 dark:fill-slate-500'
                  }`}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend Footer */}
      {showSecondary && (
        <div className="flex items-center justify-end gap-4 mt-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full" style={{ backgroundColor: colors.stroke }} />
            <span>{primaryLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full border border-dashed" style={{ borderColor: colors.secondaryStroke }} />
            <span>{secondaryLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
};
