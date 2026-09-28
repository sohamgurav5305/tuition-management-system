import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';

export interface RecordItem {
  id: string;
  name: string;
  location: string;
  inspector: string;
  date: string;
  status: 'Completed' | 'Enrolled' | 'Active';
  result: 'Paid' | 'Verified' | 'Partial';
}

interface RecentRecordsTableProps {
  title?: string;
  viewAllLink?: string;
  records?: RecordItem[];
  totalRecordsCount?: number;
}

const DEFAULT_RECORDS: RecordItem[] = [
  {
    id: 'REC-2025-0819-01',
    name: 'Rahul Sharma',
    location: 'JEE Adv Morning',
    inspector: 'Accounts Desk',
    date: 'Jun 16, 2025',
    status: 'Enrolled',
    result: 'Paid',
  },
  {
    id: 'REC-2025-0818-04',
    name: 'Priya Patel',
    location: 'NEET Droppers A1',
    inspector: 'Accounts Desk',
    date: 'Jun 15, 2025',
    status: 'Enrolled',
    result: 'Paid',
  },
  {
    id: 'REC-2025-0817-12',
    name: 'Amit Verma',
    location: 'Foundation 10th',
    inspector: 'Admin Desk',
    date: 'Jun 15, 2025',
    status: 'Enrolled',
    result: 'Paid',
  },
  {
    id: 'REC-2025-0816-09',
    name: 'Sneha Kulkarni',
    location: 'Olympiad Rankers',
    inspector: 'Accounts Desk',
    date: 'Jun 14, 2025',
    status: 'Enrolled',
    result: 'Paid',
  },
  {
    id: 'REC-2025-0815-03',
    name: 'Rohan Gupta',
    location: 'Crash Course Revision',
    inspector: 'Admin Desk',
    date: 'Jun 14, 2025',
    status: 'Enrolled',
    result: 'Paid',
  },
];

export const RecentRecordsTable: React.FC<RecentRecordsTableProps> = ({
  title = 'Recent Student Admission & Fee Records',
  viewAllLink = '/fees',
  records = DEFAULT_RECORDS,
  totalRecordsCount = 25,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors flex flex-col justify-between">
      {/* Table Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
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

      {/* Table Container */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Receipt ID</th>
              <th className="py-2.5 px-3">Student Name</th>
              <th className="py-2.5 px-3">Enrolled Batch</th>
              <th className="py-2.5 px-3">Processed By</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Enrollment</th>
              <th className="py-2.5 px-3">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {records.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* ID with File Icon */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <Link
                      to="/receipts"
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {row.id}
                    </Link>
                  </div>
                </td>

                {/* Student Name */}
                <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                  {row.name}
                </td>

                {/* Batch */}
                <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                  {row.location}
                </td>

                {/* Inspector / Staff */}
                <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-medium">
                  {row.inspector}
                </td>

                {/* Date */}
                <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {row.date}
                </td>

                {/* Status Badge */}
                <td className="py-3 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                    {row.status}
                  </span>
                </td>

                {/* Result Badge */}
                <td className="py-3 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                    {row.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          Showing 1 to {records.length} of {totalRecordsCount} records
        </span>

        {/* Page Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {[1, 2, 3, 4, 5].map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`w-6 h-6 rounded-md text-xs font-bold transition-colors ${
                currentPage === p
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
