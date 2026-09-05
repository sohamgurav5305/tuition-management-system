import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, LucideIcon } from 'lucide-react';

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
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

const COLOR_MAP: Record<string, { topBg: string; iconBg: string; iconColor: string; ringColor: string }> = {
  blue: {
    topBg: 'from-blue-500/15 via-blue-400/10 to-transparent',
    iconBg: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    ringColor: 'hover:border-blue-500',
  },
  indigo: {
    topBg: 'from-indigo-500/15 via-indigo-400/10 to-transparent',
    iconBg: 'bg-indigo-50 border-indigo-200',
    iconColor: 'text-indigo-600',
    ringColor: 'hover:border-indigo-500',
  },
  purple: {
    topBg: 'from-purple-500/15 via-purple-400/10 to-transparent',
    iconBg: 'bg-purple-50 border-purple-200',
    iconColor: 'text-purple-600',
    ringColor: 'hover:border-purple-500',
  },
  violet: {
    topBg: 'from-violet-500/15 via-violet-400/10 to-transparent',
    iconBg: 'bg-violet-50 border-violet-200',
    iconColor: 'text-violet-600',
    ringColor: 'hover:border-violet-500',
  },
  emerald: {
    topBg: 'from-emerald-500/15 via-emerald-400/10 to-transparent',
    iconBg: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600',
    ringColor: 'hover:border-emerald-500',
  },
  amber: {
    topBg: 'from-amber-500/15 via-amber-400/10 to-transparent',
    iconBg: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600',
    ringColor: 'hover:border-amber-500',
  },
  rose: {
    topBg: 'from-rose-500/15 via-rose-400/10 to-transparent',
    iconBg: 'bg-rose-50 border-rose-200',
    iconColor: 'text-rose-600',
    ringColor: 'hover:border-rose-500',
  },
  cyan: {
    topBg: 'from-cyan-500/15 via-cyan-400/10 to-transparent',
    iconBg: 'bg-cyan-50 border-cyan-200',
    iconColor: 'text-cyan-600',
    ringColor: 'hover:border-cyan-500',
  },
  sky: {
    topBg: 'from-sky-500/15 via-sky-400/10 to-transparent',
    iconBg: 'bg-sky-50 border-sky-200',
    iconColor: 'text-sky-600',
    ringColor: 'hover:border-sky-500',
  },
  teal: {
    topBg: 'from-teal-500/15 via-teal-400/10 to-transparent',
    iconBg: 'bg-teal-50 border-teal-200',
    iconColor: 'text-teal-600',
    ringColor: 'hover:border-teal-500',
  },
  pink: {
    topBg: 'from-pink-500/15 via-pink-400/10 to-transparent',
    iconBg: 'bg-pink-50 border-pink-200',
    iconColor: 'text-pink-600',
    ringColor: 'hover:border-pink-500',
  },
  orange: {
    topBg: 'from-orange-500/15 via-orange-400/10 to-transparent',
    iconBg: 'bg-orange-50 border-orange-200',
    iconColor: 'text-orange-600',
    ringColor: 'hover:border-orange-500',
  },
  slate: {
    topBg: 'from-slate-500/15 via-slate-400/10 to-transparent',
    iconBg: 'bg-slate-50 border-slate-200',
    iconColor: 'text-slate-600',
    ringColor: 'hover:border-slate-500',
  },
};

export const PortalModuleGrid: React.FC<PortalModuleGridProps> = ({
  modules,
  searchPlaceholder = 'Search Module',
  children,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    const words = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return modules;

    return modules.filter((m) => {
      const combined = `${m.title} ${m.subtitle || ''} ${m.category || ''}`.toLowerCase();
      return words.every((word) => combined.includes(word));
    });
  }, [modules, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 2. Centered Search Module Bar */}
      <div className="max-w-xl mx-auto px-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-5 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-full shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center font-medium placeholder:text-slate-400 text-slate-900 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 3. EduPlus Card Grid Layout */}
      <div>
        {filteredModules.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No modules match "{searchQuery}"</p>
            <p className="text-[11px] text-slate-400 mt-1">Try searching for attendance, exams, fees, or materials.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
            {filteredModules.map((item) => {
              const Icon = item.icon;
              const style = COLOR_MAP[item.color || 'blue'] || COLOR_MAP.blue;

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`group relative bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-md ${style.ringColor} transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between overflow-hidden text-center`}
                >
                  {/* Top Curved Gradient Header */}
                  <div
                    className={`bg-gradient-to-b ${style.topBg} pt-4 sm:pt-5 pb-8 sm:pb-9 px-2 rounded-t-2xl sm:rounded-t-3xl border-b border-slate-100/60`}
                  >
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                  </div>

                  {/* Circular Icon Emblem in Center */}
                  <div className="relative -mt-6 sm:-mt-7 mb-2 z-10 flex justify-center">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-2 shadow-sm ${style.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}
                    >
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${style.iconColor}`} />
                    </div>
                  </div>

                  {/* Bottom Subtitle / Badge */}
                  <div className="pb-3.5 px-2">
                    {item.subtitle ? (
                      <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate">
                        {item.subtitle}
                      </p>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Portal Module
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Optional Extra Dashboard Details / Widgets */}
      {children && (
        <div className="pt-2">
          {children}
        </div>
      )}
    </div>
  );
};
