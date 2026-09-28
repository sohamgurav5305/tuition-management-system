import React, { useEffect, useState } from 'react';
import { Filter, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { attendanceApi } from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { formatDate } from '../../utils/date';

export const MyAttendance: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');

  const fetchAttendance = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await attendanceApi.getMyAttendance(
        selectedSubjectFilter !== 'ALL' ? selectedSubjectFilter : undefined
      );
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load my attendance', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(true);
    const interval = setInterval(() => {
      fetchAttendance(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedSubjectFilter]);

  if (loading && !data) return <LoadingSkeleton count={5} />;

  const stats = data?.stats || { total: 0, present: 0, absent: 0, percentage: 0, subjects: {} };
  const records = data?.records || [];
  const subjectStats = stats.subjects || {};
  const subjectList = Object.keys(subjectStats);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader
        title="My Attendance Record"
        subtitle="Track your lecture attendance compliance, verified present sessions, and subject-wise logs."
        badge={`${stats.percentage}% Compliance`}
      />

      {/* Overall KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            Overall Rate
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.percentage}%
          </p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            Present Sessions
          </span>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {stats.present}
          </p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            Absences
          </span>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {stats.absent}
          </p>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Session History Log
          </h3>

          {/* Subject Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <button
              onClick={() => setSelectedSubjectFilter('ALL')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                selectedSubjectFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Subjects
            </button>
            {subjectList.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSubjectFilter(s)}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  selectedSubjectFilter === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Session Date</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Faculty Instructor</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.length > 0 ? (
                records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100 font-mono">
                      {formatDate(r.date)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {r.subject || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {r.faculty ? `${r.faculty.firstName} ${r.faculty.lastName}` : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                      {r.batch?.name || 'Class Batch'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Badge
                        variant={r.status === 'PRESENT' ? 'success' : 'danger'}
                        size="sm"
                        dot
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    No attendance records found for this subject filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
