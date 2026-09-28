import React from 'react';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  colorScheme?: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
  label?: string;
  subLabel?: string;
  showPercentage?: boolean;
}

const RING_COLORS: Record<string, { stroke: string; track: string; text: string }> = {
  emerald: { stroke: '#10b981', track: 'text-emerald-100 dark:text-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400' },
  blue: { stroke: '#3b82f6', track: 'text-blue-100 dark:text-blue-950/60', text: 'text-blue-600 dark:text-blue-400' },
  purple: { stroke: '#8b5cf6', track: 'text-purple-100 dark:text-purple-950/60', text: 'text-purple-600 dark:text-purple-400' },
  amber: { stroke: '#f59e0b', track: 'text-amber-100 dark:text-amber-950/60', text: 'text-amber-600 dark:text-amber-400' },
  rose: { stroke: '#f43f5e', track: 'text-rose-100 dark:text-rose-950/60', text: 'text-rose-600 dark:text-rose-400' },
};

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 80,
  strokeWidth = 8,
  colorScheme = 'blue',
  label,
  subLabel,
  showPercentage = true,
}) => {
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  const colors = RING_COLORS[colorScheme] || RING_COLORS.blue;

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={colors.track}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-black tabular-nums ${colors.text}`}>
              {Math.round(clampedPct)}%
            </span>
          </div>
        )}
      </div>

      {(label || subLabel) && (
        <div className="min-w-0">
          {label && (
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {label}
            </p>
          )}
          {subLabel && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
              {subLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
