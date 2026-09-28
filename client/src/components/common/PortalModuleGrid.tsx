import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

export interface PortalModuleItem {
  id: string;
  title: string;
  subtitle?: string;
  path: string;
  icon: LucideIcon;
  color?: 'blue' | 'indigo' | 'purple' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'sky' | 'teal' | 'pink' | 'orange' | 'slate';
  badge?: string | number;
  category?: string;
}

interface PortalModuleGridProps {
  modules: PortalModuleItem[];
  children?: React.ReactNode;
}

const COLOR_MAP: Record<string, { topBg: string; iconBg: string; iconColor: string; ringColor: string }> = {
  blue: {
    topBg: 'from-blue-500/15 via-blue-400/10 to-transparent dark:from-blue-500/25 dark:via-blue-400/15',
    iconBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    ringColor: 'hover:border-blue-500 dark:hover:border-blue-400',
  },
  indigo: {
    topBg: 'from-indigo-500/15 via-indigo-400/10 to-transparent dark:from-indigo-500/25 dark:via-indigo-400/15',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    ringColor: 'hover:border-indigo-500 dark:hover:border-indigo-400',
  },
  purple: {
    topBg: 'from-purple-500/15 via-purple-400/10 to-transparent dark:from-purple-500/25 dark:via-purple-400/15',
    iconBg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
    iconColor: 'text-purple-600 dark:text-purple-400',
    ringColor: 'hover:border-purple-500 dark:hover:border-purple-400',
  },
  violet: {
    topBg: 'from-violet-500/15 via-violet-400/10 to-transparent dark:from-violet-500/25 dark:via-violet-400/15',
    iconBg: 'bg-violet-50 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800',
    iconColor: 'text-violet-600 dark:text-violet-400',
    ringColor: 'hover:border-violet-500 dark:hover:border-violet-400',
  },
  emerald: {
    topBg: 'from-emerald-500/15 via-emerald-400/10 to-transparent dark:from-emerald-500/25 dark:via-emerald-400/15',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    ringColor: 'hover:border-emerald-500 dark:hover:border-emerald-400',
  },
  amber: {
    topBg: 'from-amber-500/15 via-amber-400/10 to-transparent dark:from-amber-500/25 dark:via-amber-400/15',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    ringColor: 'hover:border-amber-500 dark:hover:border-amber-400',
  },
  rose: {
    topBg: 'from-rose-500/15 via-rose-400/10 to-transparent dark:from-rose-500/25 dark:via-rose-400/15',
    iconBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
    iconColor: 'text-rose-600 dark:text-rose-400',
    ringColor: 'hover:border-rose-500 dark:hover:border-rose-400',
  },
  cyan: {
    topBg: 'from-cyan-500/15 via-cyan-400/10 to-transparent dark:from-cyan-500/25 dark:via-cyan-400/15',
    iconBg: 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    ringColor: 'hover:border-cyan-500 dark:hover:border-cyan-400',
  },
  sky: {
    topBg: 'from-sky-500/15 via-sky-400/10 to-transparent dark:from-sky-500/25 dark:via-sky-400/15',
    iconBg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800',
    iconColor: 'text-sky-600 dark:text-sky-400',
    ringColor: 'hover:border-sky-500 dark:hover:border-sky-400',
  },
  teal: {
    topBg: 'from-teal-500/15 via-teal-400/10 to-transparent dark:from-teal-500/25 dark:via-teal-400/15',
    iconBg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800',
    iconColor: 'text-teal-600 dark:text-teal-400',
    ringColor: 'hover:border-teal-500 dark:hover:border-teal-400',
  },
  pink: {
    topBg: 'from-pink-500/15 via-pink-400/10 to-transparent dark:from-pink-500/25 dark:via-pink-400/15',
    iconBg: 'bg-pink-50 dark:bg-pink-950/60 border-pink-200 dark:border-pink-800',
    iconColor: 'text-pink-600 dark:text-pink-400',
    ringColor: 'hover:border-pink-500 dark:hover:border-pink-400',
  },
  orange: {
    topBg: 'from-orange-500/15 via-orange-400/10 to-transparent dark:from-orange-500/25 dark:via-orange-400/15',
    iconBg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800',
    iconColor: 'text-orange-600 dark:text-orange-400',
    ringColor: 'hover:border-orange-500 dark:hover:border-orange-400',
  },
  slate: {
    topBg: 'from-slate-500/15 via-slate-400/10 to-transparent dark:from-slate-500/25 dark:via-slate-400/15',
    iconBg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    iconColor: 'text-slate-600 dark:text-slate-300',
    ringColor: 'hover:border-slate-500 dark:hover:border-slate-400',
  },
};

export const PortalModuleGrid: React.FC<PortalModuleGridProps> = ({
  modules,
  children,
}) => {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Optional Extra Dashboard Details / Widgets / KPI Strips (Top) */}
      {children && (
        <div>
          {children}
        </div>
      )}

      {/* 2. Portal Modules Card Grid Layout */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
          {modules.map((item) => {
            const Icon = item.icon;
            const style = COLOR_MAP[item.color || 'blue'] || COLOR_MAP.blue;

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-md ${style.ringColor} transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between overflow-hidden text-center`}
              >
                {/* Top Curved Gradient Header */}
                <div
                  className={`bg-gradient-to-b ${style.topBg} pt-4 sm:pt-5 pb-8 sm:pb-9 px-2 rounded-t-2xl sm:rounded-t-3xl border-b border-slate-100/60 dark:border-slate-800/60`}
                >
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                </div>

                {/* Circular Icon Emblem in Center */}
                <div className="relative -mt-6 sm:-mt-7 mb-2 z-10 flex justify-center">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-slate-900 border-2 shadow-sm ${style.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${style.iconColor}`} />
                  </div>
                </div>

                {/* Bottom Subtitle / Badge */}
                <div className="pb-3.5 px-2">
                  {item.subtitle ? (
                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      {item.subtitle}
                    </p>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      Portal Module
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
