import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export interface ActivityItem {
  id: string;
  month: string;
  day: string;
  title: string;
  time: string;
  category: 'Audit' | 'Meeting' | 'Review' | 'Exam' | 'Fee' | 'Class';
}

interface UpcomingActivitiesCardProps {
  title?: string;
  calendarLink?: string;
  activities?: ActivityItem[];
  viewAllLink?: string;
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    month: 'JUN',
    day: '18',
    title: 'JEE Adv Mock Test 1 – Physics & Math',
    time: '9:00 AM – 12:00 PM',
    category: 'Exam',
  },
  {
    id: '2',
    month: 'JUN',
    day: '19',
    title: 'Faculty Progress Review Meeting',
    time: '1:00 PM – 2:00 PM',
    category: 'Meeting',
  },
  {
    id: '3',
    month: 'JUN',
    day: '20',
    title: 'Term 2 Fee Installment Due Date',
    time: '10:00 AM – 6:00 PM',
    category: 'Fee',
  },
];

const CATEGORY_STYLES: Record<string, string> = {
  Exam: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  Meeting: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
  Review: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
  Fee: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  Class: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800',
  Audit: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
};

export const UpcomingActivitiesCard: React.FC<UpcomingActivitiesCardProps> = ({
  title = 'Upcoming Academic Activities',
  calendarLink = '/attendance',
  activities = DEFAULT_ACTIVITIES,
  viewAllLink = '/attendance',
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {calendarLink && (
          <Link
            to={calendarLink}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Calendar
          </Link>
        )}
      </div>

      {/* Activities List */}
      <div className="space-y-3.5 my-auto">
        {activities.map((item) => {
          const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.Meeting;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {/* Left Date Box */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col items-center justify-center flex-shrink-0 text-center">
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-none">
                    {item.month}
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-slate-100 leading-none mt-0.5">
                    {item.day}
                  </span>
                </div>

                {/* Center Title & Time */}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                    {item.time}
                  </p>
                </div>
              </div>

              {/* Right Tag Badge */}
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border flex-shrink-0 ${style}`}
              >
                {item.category}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Action */}
      <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 text-right">
        <Link
          to={viewAllLink}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline group"
        >
          <span>View All Schedule</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
