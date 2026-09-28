import React, { useState, useEffect } from 'react';
import { Sparkles, GraduationCap, Quote } from 'lucide-react';

export interface EducationQuote {
  quote: string;
  author: string;
}

export const EDUCATION_QUOTES: EducationQuote[] = [
  {
    quote: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
  },
  {
    quote: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
  },
  {
    quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
  },
  {
    quote: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
  },
  {
    quote: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch",
  },
  {
    quote: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    author: "Malcolm X",
  },
  {
    quote: "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
    author: "Benjamin Franklin",
  },
  {
    quote: "The roots of education are bitter, but the fruit is sweet.",
    author: "Aristotle",
  },
  {
    quote: "Knowledge is power. Information is liberating. Education is the premise of progress.",
    author: "Kofi Annan",
  },
  {
    quote: "Develop a passion for learning. If you do, you will never cease to grow.",
    author: "Anthony J. D'Angelo",
  },
  {
    quote: "Education is not the learning of facts, but the training of the mind to think.",
    author: "Albert Einstein",
  },
  {
    quote: "Learning is a treasure that will follow its owner everywhere.",
    author: "Chinese Proverb",
  },
];

interface FreeworkLoaderProps {
  label?: string;
  quote?: string;
  author?: string;
  showQuote?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  minHeight?: string;
  fullscreen?: boolean;
  card?: boolean;
  className?: string;
}

export const FreeworkLoader: React.FC<FreeworkLoaderProps> = ({
  label = 'Loading data...',
  quote: customQuote,
  author: customAuthor,
  showQuote = true,
  size = 'md',
  minHeight = 'min-h-[300px]',
  fullscreen = false,
  card = true,
  className = '',
}) => {
  // Select one single thought per loading instance (stays stable and does not change during loading)
  const [activeQuote] = useState<EducationQuote>(() => {
    if (customQuote) {
      return { quote: customQuote, author: customAuthor || 'Thought for Today' };
    }
    const randomIndex = Math.floor(Math.random() * EDUCATION_QUOTES.length);
    return EDUCATION_QUOTES[randomIndex];
  });

  // Dimension scaling
  const sizeMap = {
    sm: { svg: 64, icon: 'w-4 h-4', container: 'p-4' },
    md: { svg: 96, icon: 'w-6 h-6', container: 'p-6' },
    lg: { svg: 120, icon: 'w-8 h-8', container: 'p-8' },
    xl: { svg: 144, icon: 'w-10 h-10', container: 'p-10' },
  };

  const { svg: svgSize, icon: iconClass } = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`flex flex-col items-center justify-center text-center space-y-5 ${className}`}>
      {/* Freework Geometric Orbital Animation */}
      <div className="relative flex items-center justify-center select-none">
        {/* Ambient Radial Gradient Glow */}
        <div className="absolute w-28 h-28 bg-gradient-to-tr from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-full blur-2xl dark:from-blue-600/30 dark:via-purple-600/25 dark:to-indigo-600/30 animate-freework-pulse pointer-events-none" />

        {/* SVG Concentric Fluid Morphing Rings */}
        <svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 100 100"
          className="overflow-visible"
        >
          <defs>
            {/* Primary Fluid Gradient */}
            <linearGradient id="freework-primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            {/* Secondary Fluid Gradient */}
            <linearGradient id="freework-secondary-grad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            {/* Glowing Drop Shadow Filter */}
            <filter id="freework-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Outermost Dotted Orbit Guide Track */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 5"
            className="text-slate-200 dark:text-slate-800"
          />

          {/* 2. Middle Fluid Primary Morphing Arc */}
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="url(#freework-primary-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="animate-freework-dash animate-freework-spin origin-center"
            filter="url(#freework-glow)"
          />

          {/* 3. Inner Counter-Rotating Gradient Arc */}
          <circle
            cx="50"
            cy="50"
            r="26"
            fill="none"
            stroke="url(#freework-secondary-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="45 75"
            className="animate-freework-counter origin-center"
          />

          {/* 4. Satellite Orbiting Energy Node */}
          <g className="animate-freework-spin origin-center" style={{ animationDuration: '3s' }}>
            <circle
              cx="50"
              cy="6"
              r="3.5"
              fill="#3b82f6"
              className="dark:fill-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]"
            />
          </g>

          {/* 5. Opposite Satellite Secondary Node */}
          <g className="animate-freework-counter origin-center" style={{ animationDuration: '4.2s' }}>
            <circle
              cx="50"
              cy="94"
              r="2.5"
              fill="#a855f7"
              className="dark:fill-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]"
            />
          </g>
        </svg>

        {/* Center Breathing Emblem (Graduation Cap / Sparkles) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/60 border border-blue-100 dark:border-slate-700/80 shadow-xs flex items-center justify-center animate-freework-pulse">
            <GraduationCap className={`${iconClass} text-blue-600 dark:text-blue-400`} />
          </div>
        </div>
      </div>

      {/* Loading Status Text with Animated Dots */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">
            {label}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      </div>

      {/* Inspirational Education Thought Banner */}
      {showQuote && (
        <div
          className="animate-quote-fade max-w-md mx-auto mt-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-indigo-950/40 border border-blue-100/90 dark:border-slate-700/80 shadow-2xs transition-all"
        >
          <div className="flex items-start gap-2.5 text-left">
            <div className="p-1 rounded-lg bg-blue-100/80 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 mt-0.5 flex-shrink-0">
              <Quote className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 italic leading-relaxed">
                "{activeQuote.quote}"
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                <span>{activeQuote.author}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md dark:bg-slate-950/70">
        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full mx-4">
          {content}
        </div>
      </div>
    );
  }

  if (card) {
    return (
      <div
        className={`w-full flex items-center justify-center p-8 sm:p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors ${minHeight}`}
      >
        {content}
      </div>
    );
  }

  return (
    <div className={`w-full flex items-center justify-center ${minHeight}`}>
      {content}
    </div>
  );
};
