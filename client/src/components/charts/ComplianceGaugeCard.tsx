import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface ComplianceGaugeCardProps {
  title?: string;
  viewAllLink?: string;
  percentage?: number;
  statusLabel?: string;
  metric1Label?: string;
  metric1Value?: string | number;
  metric2Label?: string;
  metric2Value?: string | number;
  bottomActionText?: string;
  bottomActionLink?: string;
}

export const ComplianceGaugeCard: React.FC<ComplianceGaugeCardProps> = ({
  title = 'Academic Attendance',
  viewAllLink = '/attendance',
  percentage = 94.2,
  statusLabel = 'Good Standing',
  metric1Label = 'Present Today',
  metric1Value = '482',
  metric2Label = 'Total Enrolled',
  metric2Value = '510',
  bottomActionText = 'Attendance Register',
  bottomActionLink = '/attendance',
}) => {
  const size = 150;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
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

      {/* Circular Gauge */}
      <div className="flex flex-col items-center justify-center my-auto py-1">
        <div className="relative flex items-center justify-center">
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
            {/* Value fill */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">
              {percentage}%
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-metrics Bottom Row */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-2 text-left mb-3">
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {metric1Label}
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {metric1Value}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {metric2Label}
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {metric2Value}
            </p>
          </div>
        </div>

        {/* Bottom Link Action */}
        <Link
          to={bottomActionLink}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline group"
        >
          <span>{bottomActionText}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
