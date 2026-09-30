import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { attendanceApi, studentApi } from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { PageHeader } from '../../components/common/PageHeader';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MyAttendance: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [batchSubjects, setBatchSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const fetchBatchSubjects = async () => {
    try {
      const res = await studentApi.getMyProfile();
      const profile = res.data?.data;
      const subs: string[] = [];
      if (profile?.batch?.subjectInstructors && Array.isArray(profile.batch.subjectInstructors)) {
        profile.batch.subjectInstructors.forEach((inst: any) => {
          if (inst.subject) subs.push(inst.subject);
        });
      }
      if (profile?.batch?.faculty?.subjectTaught) {
        subs.push(profile.batch.faculty.subjectTaught);
      }
      if (profile?.course?.subjects) {
        if (Array.isArray(profile.course.subjects)) {
          subs.push(...profile.course.subjects);
        } else if (typeof profile.course.subjects === 'string') {
          try {
            const parsed = JSON.parse(profile.course.subjects);
            if (Array.isArray(parsed)) subs.push(...parsed);
          } catch {
            subs.push(profile.course.subjects);
          }
        }
      }
      setBatchSubjects(Array.from(new Set(subs.filter(Boolean))));
    } catch {
      // ignore
    }
  };

  const fetchAttendance = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await attendanceApi.getMyAttendance();
      setData(res.data.data);
      if (res.data?.data?.records?.length > 0) {
        const latestDate = new Date(res.data.data.records[0].date);
        if (!isNaN(latestDate.getTime())) {
          setSelectedYear(latestDate.getFullYear());
          setSelectedMonth(latestDate.getMonth());
        }
      }
    } catch (err) {
      console.error('Failed to load my attendance', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(true);
    fetchBatchSubjects();
    const interval = setInterval(() => {
      fetchAttendance(false);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) return <LoadingSkeleton count={5} />;

  const stats = data?.stats || { total: 0, present: 0, absent: 0, percentage: 0, subjects: {} };
  const records = data?.records || [];

  const subjects = Array.from(
    new Set([
      ...batchSubjects,
      ...records.map((r: any) => r.subject).filter(Boolean),
      ...Object.keys(stats.subjects || {}),
    ])
  ).filter(Boolean);

  if (subjects.length === 0) {
    subjects.push('Physics');
  }

  // Filter records matching the selected month & year
  const monthRecords = records.filter((r: any) => {
    const d = new Date(r.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const daysList = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader title="My Attendance Record" />

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

      {/* 12 Months Selection Buttons Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3 shadow-xs">
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
          {MONTHS.map((monthName, idx) => {
            const isSelected = selectedMonth === idx;
            return (
              <button
                key={monthName}
                type="button"
                onClick={() => setSelectedMonth(idx)}
                className={`py-2 px-1 text-xs font-bold rounded-2xl transition-all text-center ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="hidden xl:inline">{monthName}</span>
                <span className="xl:hidden">{monthName.slice(0, 3)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Month Attendance Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            {MONTHS[selectedMonth]} {selectedYear} Attendance
          </h3>

          {/* Quick Legend */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center">
                P
              </span>
              <span className="text-slate-600 dark:text-slate-400">Present</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-[10px] flex items-center justify-center">
                A
              </span>
              <span className="text-slate-600 dark:text-slate-400">Absent</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 font-bold text-[10px] flex items-center justify-center">
                NA
              </span>
              <span className="text-slate-400">Not Applicable</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Date</th>
                {subjects.map((sub) => (
                  <th key={sub} className="px-4 py-3 text-center">
                    {sub}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {daysList.map((day) => {
                const dateStr = `${String(day).padStart(2, '0')}/${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear}`;
                const dateObj = new Date(selectedYear, selectedMonth, day);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const isSunday = dateObj.getDay() === 0;

                return (
                  <tr
                    key={day}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                      isSunday ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <span>{dateStr}</span>
                        <span className="text-[10px] font-medium text-slate-400">({dayName})</span>
                      </div>
                    </td>

                    {subjects.map((sub) => {
                      const match = monthRecords.find((r: any) => {
                        const recDate = new Date(r.date);
                        return (
                          recDate.getDate() === day &&
                          recDate.getMonth() === selectedMonth &&
                          recDate.getFullYear() === selectedYear &&
                          r.subject?.toLowerCase() === sub.toLowerCase()
                        );
                      });

                      let statusBadge = (
                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200/60 dark:border-slate-700">
                          NA
                        </span>
                      );

                      if (match) {
                        if (match.status === 'PRESENT') {
                          statusBadge = (
                            <span className="inline-block px-3 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                              P
                            </span>
                          );
                        } else if (match.status === 'ABSENT') {
                          statusBadge = (
                            <span className="inline-block px-3 py-0.5 rounded-lg text-xs font-extrabold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs">
                              A
                            </span>
                          );
                        }
                      }

                      return (
                        <td key={sub} className="px-4 py-3 text-center">
                          {statusBadge}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800/90 border-t-2 border-slate-200 dark:border-slate-700 font-bold">
              <tr className="border-b border-slate-200/80 dark:border-slate-800">
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 uppercase text-[11px] font-bold">
                  Total Lectures
                </td>
                {subjects.map((sub) => {
                  const subRecords = monthRecords.filter(
                    (r: any) =>
                      r.subject?.toLowerCase() === sub.toLowerCase() &&
                      (r.status === 'PRESENT' || r.status === 'ABSENT')
                  );
                  return (
                    <td key={sub} className="px-4 py-3 text-center">
                      <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {subRecords.length}
                      </span>
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-slate-200/80 dark:border-slate-800">
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 uppercase text-[11px] font-bold">
                  Present Count
                </td>
                {subjects.map((sub) => {
                  const subRecords = monthRecords.filter(
                    (r: any) =>
                      r.subject?.toLowerCase() === sub.toLowerCase() &&
                      (r.status === 'PRESENT' || r.status === 'ABSENT')
                  );
                  const presentCount = subRecords.filter((r: any) => r.status === 'PRESENT').length;
                  return (
                    <td key={sub} className="px-4 py-3 text-center">
                      <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-xs font-black text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {presentCount}
                      </span>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 uppercase text-[11px] font-bold">
                  Attendance Rate
                </td>
                {subjects.map((sub) => {
                  const subRecords = monthRecords.filter(
                    (r: any) =>
                      r.subject?.toLowerCase() === sub.toLowerCase() &&
                      (r.status === 'PRESENT' || r.status === 'ABSENT')
                  );
                  const total = subRecords.length;
                  const presentCount = subRecords.filter((r: any) => r.status === 'PRESENT').length;
                  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;
                  return (
                    <td key={sub} className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-xs font-black border ${
                          total === 0
                            ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700'
                            : rate >= 75
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {total > 0 ? `${rate}%` : 'N/A'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
