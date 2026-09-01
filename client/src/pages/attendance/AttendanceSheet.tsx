import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
  Save,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  CheckCheck,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import { attendanceApi, batchApi } from '../../services/api';
import { Batch } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';

interface StudentAttendanceEntry {
  studentId: string;
  studentCustomId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  remarks?: string;
  isMarked?: boolean;
}

export const AttendanceSheet: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams] = useSearchParams();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(searchParams.get('batchId') || '');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSubject, setSelectedSubject] = useState<string>('Physics');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([
    'Physics',
    'Chemistry',
    'Mathematics',
    'Botany',
    'Zoology',
  ]);
  const [roster, setRoster] = useState<StudentAttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res = await batchApi.getAll({ status: 'ACTIVE' });
        const list = res.data.data;
        setBatches(list);
        if (!selectedBatchId && list.length > 0) {
          setSelectedBatchId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load batches', err);
      } finally {
        setLoading(false);
      }
    };
    loadBatches();
  }, []);

  const fetchAttendanceSheet = async () => {
    if (!selectedBatchId) return;
    try {
      setLoading(true);
      const res = await attendanceApi.getBatchAttendance(selectedBatchId, selectedDate, selectedSubject);
      setRoster(res.data.data.records);
      if (res.data.data.batch?.subjects && res.data.data.batch.subjects.length > 0) {
        setAvailableSubjects(res.data.data.batch.subjects);
        if (!res.data.data.batch.subjects.includes(selectedSubject)) {
          setSelectedSubject(res.data.data.batch.subjects[0]);
        }
      }
    } catch (err: any) {
      error('Error', err.response?.data?.message || 'Failed to fetch batch attendance roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBatchId) {
      fetchAttendanceSheet();
    }
  }, [selectedBatchId, selectedDate, selectedSubject]);

  const setStudentStatus = (studentId: string, status: 'PRESENT' | 'LATE' | 'ABSENT') => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const handleMarkAllPresent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: 'PRESENT' })));
    success('Marked', 'All students marked Present.');
  };

  const handleSaveAttendance = async () => {
    if (!selectedBatchId || roster.length === 0) return;
    setSaving(true);
    try {
      await attendanceApi.markAttendance({
        batchId: selectedBatchId,
        date: selectedDate,
        subject: selectedSubject,
        records: roster.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks || '',
        })),
      });
      success('Attendance Saved', `Rollcall for ${selectedSubject} on ${selectedDate} has been recorded.`);
      fetchAttendanceSheet();
    } catch (err: any) {
      error('Save Failed', err.response?.data?.message || 'Could not save attendance sheet');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
  const lateCount = roster.filter((r) => r.status === 'LATE').length;
  const absentCount = roster.filter((r) => r.status === 'ABSENT').length;
  const totalCount = roster.length || 1;
  const attendanceRate = Math.round(((presentCount + lateCount) / totalCount) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <PageHeader
        title="Daily Attendance Rollcall"
        subtitle="Mark and monitor batch attendance, tracking daily presence rates and remarks."
        badge={`${roster.length} Students`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={CheckCheck}
              onClick={handleMarkAllPresent}
            >
              Mark All Present
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Save}
              isLoading={saving}
              onClick={handleSaveAttendance}
            >
              Save Attendance
            </Button>
          </div>
        }
      />

      {/* Top Controls Bar */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Date Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Session Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Batch Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            Select Batch Cohort:
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900 dark:text-slate-100"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.course?.name || 'Academic'})
              </option>
            ))}
          </select>
        </div>

        {/* Subject Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            Lecture Subject:
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900 dark:text-slate-100"
          >
            {availableSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Summary Metrics & Mini-Visualization */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Roster</span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
            {roster.length} Students
          </span>
        </div>

        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Present</span>
          <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">
            {presentCount} Students
          </span>
        </div>

        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Late</span>
          <span className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1 block">
            {lateCount} Students
          </span>
        </div>

        <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Absent</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{attendanceRate}% Rate</span>
          </div>
          <span className="text-xl font-black text-rose-700 dark:text-rose-300 mt-1 block">
            {absentCount} Students
          </span>
        </div>
      </div>

      {/* Roster Rollcall Table */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton count={5} />
          </div>
        ) : roster.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No students currently enrolled in this batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 w-12 text-center">#</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3 text-center">Attendance Status</th>
                  <th className="px-5 py-3">Remarks / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {roster.map((s, idx) => (
                  <tr key={s.studentId} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-3.5 text-center font-mono text-slate-400 font-bold">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {s.firstName} {s.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{s.studentCustomId}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      <span>{s.phone}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setStudentStatus(s.studentId, 'PRESENT')}
                          className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                            s.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100 hover:text-emerald-700'
                          }`}
                        >
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentStatus(s.studentId, 'LATE')}
                          className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                            s.status === 'LATE'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-100 hover:text-amber-700'
                          }`}
                        >
                          Late
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentStatus(s.studentId, 'ABSENT')}
                          className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                            s.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-700'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        value={s.remarks || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRoster((prev) =>
                            prev.map((item) =>
                              item.studentId === s.studentId ? { ...item, remarks: val } : item
                            )
                          );
                        }}
                        placeholder="e.g., Medical leave, Homework submitted"
                        className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
