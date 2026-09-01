import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  BookOpen,
  UserCheck,
  GraduationCap,
  Filter,
} from 'lucide-react';
import { attendanceApi } from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Badge } from '../../components/common/Badge';

export const MyAttendance: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceApi.getMyAttendance(
        selectedSubjectFilter !== 'ALL' ? selectedSubjectFilter : undefined
      );
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load my attendance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedSubjectFilter]);

  if (loading && !data) return <LoadingSkeleton count={5} />;

  const stats = data?.stats || { total: 0, present: 0, late: 0, absent: 0, percentage: 0, subjects: {} };
  const records = data?.records || [];
  const subjectStats = stats.subjects || {};
  const subjectList = Object.keys(subjectStats);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          My Subject-Wise Attendance
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Detailed lecture presence per subject, teacher-marked session logs, and overall academic compliance.
        </p>
      </div>

      {/* Overall KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Overall Rate</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.percentage}%
          </p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Present Sessions</span>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {stats.present}
          </p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Late Arrivals</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats.late}
          </p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Absences</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {stats.absent}
          </p>
        </div>
      </div>

      {/* Subject-Wise Attendance Breakdown Cards */}
      {subjectList.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-600" /> Subject-Wise Attendance Breakdown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(subjectStats).map(([subj, subStat]: [string, any]) => (
              <div
                key={subj}
                onClick={() => setSelectedSubjectFilter(selectedSubjectFilter === subj ? 'ALL' : subj)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedSubjectFilter === subj
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{subj}</h4>
                    {subStat.facultyName && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <GraduationCap className="w-3 h-3 text-purple-500" /> {subStat.facultyName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-base font-black ${
                      subStat.percentage >= 85
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : subStat.percentage >= 75
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {subStat.percentage}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      subStat.percentage >= 85
                        ? 'bg-emerald-500'
                        : subStat.percentage >= 75
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, subStat.percentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>
                    {subStat.present} of {subStat.total} Present
                  </span>
                  <span>{subStat.absent} Absent</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Session History Log
          </h3>

          {/* Subject Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <button
              onClick={() => setSelectedSubjectFilter('ALL')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                selectedSubjectFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
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
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Session Date</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Faculty Instructor</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Remarks / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.length > 0 ? (
                records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {r.date}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {r.subject || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {r.faculty ? `${r.faculty.firstName} ${r.faculty.lastName}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.batch?.name || 'Class Batch'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          r.status === 'PRESENT'
                            ? 'success'
                            : r.status === 'LATE'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.remarks || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
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
