import React, { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import { attendanceApi } from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
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
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Attendance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          
        </p>
      </div>

      {/* Overall KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Overall Rate</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
            {stats.percentage}%
          </p>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Present Sessions</span>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
            {stats.present}
          </p>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Absences</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
            {stats.absent}
          </p>
        </div>
      </div>


      {/* Attendance History Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">
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
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200/60">
              <tr>
                <th className="px-4 py-3">Session Date</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Faculty Instructor</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length > 0 ? (
                records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatDate(r.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-blue-600">
                        {r.subject || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.faculty ? `${r.faculty.firstName} ${r.faculty.lastName}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.batch?.name || 'Class Batch'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={r.status === 'PRESENT' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
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
