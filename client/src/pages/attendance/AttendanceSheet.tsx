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
import { useAuth } from '../../context/AuthContext';
import { PreviousAttendanceRecords } from './PreviousAttendanceRecords';
import { formatDate } from '../../utils/date';

interface StudentAttendanceEntry {
  studentId: string;
  studentCustomId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'PRESENT' | 'ABSENT';
  remarks?: string;
  isMarked?: boolean;
}

export const AttendanceSheet: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [searchParams] = useSearchParams();

  const isAccountant = user?.role === 'ACCOUNTANT';
  const [activeTab, setActiveTab] = useState<'daily' | 'history'>('daily');

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

  const fetchAttendanceSheet = async (showLoading = false) => {
    if (!selectedBatchId) return;
    try {
      if (showLoading) setLoading(true);
      const res = await attendanceApi.getBatchAttendance(selectedBatchId, selectedDate, selectedSubject);
      setRoster(res.data.data.records);
      if (res.data.data.batch?.subjects && res.data.data.batch.subjects.length > 0) {
        setAvailableSubjects(res.data.data.batch.subjects);
        if (!res.data.data.batch.subjects.includes(selectedSubject)) {
          setSelectedSubject(res.data.data.batch.subjects[0]);
        }
      }
    } catch (err: any) {
      if (showLoading) {
        error('Error', err.response?.data?.message || 'Failed to fetch batch attendance roster');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBatchId) {
      fetchAttendanceSheet(true);
      const interval = setInterval(() => {
        fetchAttendanceSheet(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedBatchId, selectedDate, selectedSubject]);

  const setStudentStatus = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
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
      success('Attendance Saved', `Attendance for ${selectedSubject} on ${formatDate(selectedDate)} has been recorded.`);
      fetchAttendanceSheet();
    } catch (err: any) {
      error('Save Failed', err.response?.data?.message || 'Could not save attendance sheet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <PageHeader
        title="Attendance"
        actions={
          activeTab === 'daily' && !isAccountant ? (
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
          ) : isAccountant && activeTab === 'daily' ? (
            <Badge variant="primary" size="sm" dot>
              Audit & View Mode
            </Badge>
          ) : null
        }
      />

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 border border-slate-200/80 rounded-2xl w-fit print:hidden">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'daily'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Mark Daily Attendance
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-white text-purple-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Previous Attendance Records
        </button>
      </div>

      {activeTab === 'history' ? (
        <PreviousAttendanceRecords />
      ) : (
        <>
          {/* Top Controls Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Date Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Session Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900"
          />
        </div>

        {/* Batch Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            Select Batch:
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900"
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
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            Lecture Subject:
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900"
          >
            {availableSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Roster Attendance Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
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
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 w-12 text-center">#</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3 text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roster.map((s, idx) => (
                  <tr key={s.studentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-center font-mono text-slate-400 font-bold">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 block">
                        {s.firstName} {s.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{s.studentCustomId}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      <span>{s.phone}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {isAccountant ? (
                        <div className="flex items-center justify-center">
                          <Badge
                            variant={s.status === 'PRESENT' ? 'success' : 'danger'}
                            size="xs"
                            dot
                          >
                            {s.status}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setStudentStatus(s.studentId, 'PRESENT')}
                            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                              s.status === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'
                            }`}
                          >
                            Present
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentStatus(s.studentId, 'ABSENT')}
                            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                              s.status === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};
