import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Save,
  CheckCheck,
  BookOpen,
  Calendar,
  Users,
  Info,
} from 'lucide-react';
import { attendanceApi, batchApi } from '../../services/api';
import { Batch } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';

interface StudentInfo {
  id: string;
  studentId?: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'NA';

export const AttendanceSheet: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams] = useSearchParams();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(searchParams.get('batchId') || '');

  // Default month: YYYY-MM (e.g. 2026-09)
  const currentYearMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [selectedSubject, setSelectedSubject] = useState<string>('Physics');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([
    'Physics',
    'Chemistry',
    'Mathematics',
  ]);

  const [students, setStudents] = useState<StudentInfo[]>([]);
  // Map: studentId -> { 'YYYY-MM-DD': 'PRESENT' | 'ABSENT' | 'NA' }
  const [gridData, setGridData] = useState<Record<string, Record<string, AttendanceStatus>>>({});
  const [initialGridData, setInitialGridData] = useState<Record<string, Record<string, AttendanceStatus>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Compute days in the selected month
  const monthDays = useMemo(() => {
    if (!selectedMonth) return [];
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-12
    const totalDays = new Date(year, month, 0).getDate();

    const days = [];
    const weekdayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dateStr = `${yearStr}-${monthStr.padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const weekday = weekdayNames[dateObj.getDay()];
      const isSunday = dateObj.getDay() === 0;

      days.push({
        dayNumber: d,
        dateStr,
        weekday,
        isSunday,
      });
    }
    return days;
  }, [selectedMonth]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Check unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(gridData) !== JSON.stringify(initialGridData);
  }, [gridData, initialGridData]);

  // Load Batches
  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res = await batchApi.getAll({ status: 'ACTIVE' });
        const list = res.data.data || [];
        setBatches(list);
        if (!selectedBatchId && list.length > 0) {
          setSelectedBatchId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load batches', err);
      }
    };
    loadBatches();
  }, []);

  // Update subjects when batch changes
  useEffect(() => {
    if (selectedBatchId) {
      const b = batches.find((x) => x.id === selectedBatchId);
      if (b && b.course?.subjects) {
        try {
          const subs = JSON.parse(b.course.subjects);
          if (Array.isArray(subs) && subs.length > 0) {
            setAvailableSubjects(subs);
            if (!subs.includes(selectedSubject)) setSelectedSubject(subs[0]);
          }
        } catch {
          const subs = b.course.subjects.split(',').map((s: string) => s.trim()).filter(Boolean);
          if (subs.length > 0) {
            setAvailableSubjects(subs);
            if (!subs.includes(selectedSubject)) setSelectedSubject(subs[0]);
          }
        }
      }
    }
  }, [selectedBatchId, batches]);

  // Fetch Month Attendance Data
  const fetchMonthlyData = async (showLoading = false) => {
    if (!selectedBatchId || !selectedMonth) return;
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const totalDays = new Date(year, month, 0).getDate();

    const startDate = `${yearStr}-${monthStr.padStart(2, '0')}-01`;
    const endDate = `${yearStr}-${monthStr.padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;

    try {
      if (showLoading) setLoading(true);
      const res = await attendanceApi.getAttendanceRange(
        selectedBatchId,
        startDate,
        endDate,
        selectedSubject
      );

      const data = res.data.data;
      const studentList: StudentInfo[] = (data.students || []).map((s: any) => ({
        id: s.id || s.studentId,
        studentId: s.studentCustomId || s.studentId,
        rollNumber: s.rollNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        phone: s.phone,
        email: s.email,
      }));

      setStudents(studentList);

      // Build grid map: studentId -> dateStr -> status
      const newGrid: Record<string, Record<string, AttendanceStatus>> = {};
      studentList.forEach((st) => {
        newGrid[st.id] = {};
      });

      // Populate recorded attendances
      const records: Array<{ studentId: string; date: string; status: string; subject?: string }> =
        data.records || [];

      records.forEach((r) => {
        if (newGrid[r.studentId]) {
          newGrid[r.studentId][r.date] =
            r.status === 'PRESENT' ? 'PRESENT' : r.status === 'ABSENT' ? 'ABSENT' : 'NA';
        }
      });

      setGridData(newGrid);
      setInitialGridData(JSON.parse(JSON.stringify(newGrid)));
    } catch (err: any) {
      if (showLoading) {
        error('Error', err.response?.data?.message || 'Failed to fetch monthly attendance roster');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBatchId && selectedMonth) {
      fetchMonthlyData(true);
    }
  }, [selectedBatchId, selectedMonth, selectedSubject]);

  // Toggle cell in circular order: NA -> P -> A -> NA
  const toggleCell = (studentId: string, dateStr: string) => {
    setGridData((prev) => {
      const currentStudentMap = prev[studentId] || {};
      const currentStatus: AttendanceStatus = currentStudentMap[dateStr] || 'NA';

      let nextStatus: AttendanceStatus = 'NA';
      if (currentStatus === 'NA') {
        nextStatus = 'PRESENT';
      } else if (currentStatus === 'PRESENT') {
        nextStatus = 'ABSENT';
      } else if (currentStatus === 'ABSENT') {
        nextStatus = 'NA';
      }

      return {
        ...prev,
        [studentId]: {
          ...currentStudentMap,
          [dateStr]: nextStatus,
        },
      };
    });
  };

  // Mark all students Present for Today
  const handleMarkTodayAllPresent = () => {
    if (!monthDays.some((d) => d.dateStr === todayStr)) {
      error('Out of Range', 'Today is not within the currently selected month.');
      return;
    }

    setGridData((prev) => {
      const updated = { ...prev };
      students.forEach((st) => {
        updated[st.id] = {
          ...(updated[st.id] || {}),
          [todayStr]: 'PRESENT',
        };
      });
      return updated;
    });

    success('Marked', `All students marked Present for today (${todayStr})`);
  };

  // Save changes to backend
  const handleSaveAttendance = async () => {
    if (!selectedBatchId || !selectedSubject) return;

    setSaving(true);
    try {
      // Collect records that differ or are explicitly marked
      const recordsToSave: Array<{ studentId: string; date: string; status: 'PRESENT' | 'ABSENT' | 'NA' }> = [];

      students.forEach((st) => {
        const studentMap = gridData[st.id] || {};
        const initialMap = initialGridData[st.id] || {};

        monthDays.forEach((day) => {
          const currentStatus = studentMap[day.dateStr] || 'NA';
          const initStatus = initialMap[day.dateStr] || 'NA';

          if (currentStatus !== initStatus || currentStatus !== 'NA') {
            recordsToSave.push({
              studentId: st.id,
              date: day.dateStr,
              status: currentStatus,
            });
          }
        });
      });

      await attendanceApi.saveMonthlyGrid({
        batchId: selectedBatchId,
        subject: selectedSubject,
        records: recordsToSave,
      });

      setInitialGridData(JSON.parse(JSON.stringify(gridData)));
      success('Attendance Saved', `Monthly attendance for ${selectedSubject} has been successfully recorded.`);
    } catch (err: any) {
      error('Save Failed', err.response?.data?.message || 'Could not save attendance records');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Attendance"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={CheckCheck}
              onClick={handleMarkTodayAllPresent}
              disabled={loading || students.length === 0}
            >
              Mark Today All Present
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Save}
              onClick={handleSaveAttendance}
              isLoading={saving}
              disabled={loading || students.length === 0}
            >
              {hasUnsavedChanges ? 'Save Attendance *' : 'Save Attendance'}
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Select Month */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl font-semibold text-slate-800 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
              Month:
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none focus:outline-none font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
            />
          </div>

          {/* Select Batch */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl font-semibold text-slate-800 dark:text-slate-200">
            <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
              Batch:
            </span>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="bg-transparent border-none focus:outline-none font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Subject */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl font-semibold text-slate-800 dark:text-slate-200">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
              Subject:
            </span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent border-none focus:outline-none font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              {availableSubjects.map((s) => (
                <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center text-[10px]">
              NA
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">No Record</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-md bg-emerald-500 text-white font-black flex items-center justify-center text-[11px] shadow-2xs">
              P
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-md bg-rose-500 text-white font-black flex items-center justify-center text-[11px] shadow-2xs">
              A
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Absent</span>
          </div>
        </div>
      </div>

      {/* Monthly Attendance Grid Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton count={6} />
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Students Enrolled in Selected Batch
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Please choose an active batch with enrolled students to mark and view monthly attendance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 select-none">
                  {/* Fixed left headers */}
                  <th className="py-3 px-3 w-10 text-center border-r border-slate-200/60 dark:border-slate-700/60 sticky left-0 z-20 bg-slate-50 dark:bg-slate-800">
                    #
                  </th>
                  <th className="py-3 px-4 min-w-[180px] border-r border-slate-200/60 dark:border-slate-700/60 sticky left-10 z-20 bg-slate-50 dark:bg-slate-800">
                    Student Name
                  </th>

                  {/* Day columns 1..daysInMonth */}
                  {monthDays.map((day) => {
                    const isToday = day.dateStr === todayStr;
                    return (
                      <th
                        key={day.dateStr}
                        className={`py-2 px-1 text-center min-w-[38px] max-w-[42px] border-r border-slate-200/40 dark:border-slate-700/40 ${
                          isToday
                            ? 'bg-blue-100/80 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200'
                            : day.isSunday
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                            : ''
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className={`text-[12px] font-black ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                            {day.dayNumber}
                          </span>
                          <span className="text-[9px] font-semibold opacity-70 uppercase tracking-tighter">
                            {day.weekday}
                          </span>
                        </div>
                      </th>
                    );
                  })}

                  {/* Summary Headers */}
                  <th className="py-3 px-3 text-center min-w-[60px] bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold border-l border-r border-slate-200/60 dark:border-slate-700/60">
                    P
                  </th>
                  <th className="py-3 px-3 text-center min-w-[60px] bg-rose-50/60 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 font-bold border-r border-slate-200/60 dark:border-slate-700/60">
                    A
                  </th>
                  <th className="py-3 px-3 text-center min-w-[70px] bg-blue-50/60 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold">
                    %
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {students.map((student, idx) => {
                  const studentRecordMap = gridData[student.id] || {};

                  // Calculate total present and absent for this student
                  let countP = 0;
                  let countA = 0;
                  monthDays.forEach((d) => {
                    const st = studentRecordMap[d.dateStr];
                    if (st === 'PRESENT') countP++;
                    if (st === 'ABSENT') countA++;
                  });

                  const totalMarked = countP + countA;
                  const pct = totalMarked > 0 ? Math.round((countP / totalMarked) * 100) : null;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Index */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-slate-200/60 dark:border-slate-700/60 sticky left-0 z-10 bg-white dark:bg-slate-900">
                        {idx + 1}
                      </td>

                      {/* Student Name */}
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200/60 dark:border-slate-700/60 sticky left-10 z-10 bg-white dark:bg-slate-900">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[170px]" title={`${student.firstName} ${student.lastName}`}>
                            {student.firstName} {student.lastName}
                          </span>
                          {student.rollNumber && (
                            <span className="text-[10px] font-mono text-slate-400">
                              Roll: {student.rollNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Day Cells 1..daysInMonth */}
                      {monthDays.map((day) => {
                        const status: AttendanceStatus = studentRecordMap[day.dateStr] || 'NA';
                        const isToday = day.dateStr === todayStr;

                        return (
                          <td
                            key={day.dateStr}
                            className={`py-1 px-1 text-center border-r border-slate-100 dark:border-slate-800/80 ${
                              isToday ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleCell(student.id, day.dateStr)}
                              title={`${student.firstName} - ${day.dateStr}: ${status}`}
                              className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-lg flex items-center justify-center text-[11px] font-black transition-all cursor-pointer select-none ${
                                status === 'PRESENT'
                                  ? 'bg-emerald-500 text-white shadow-xs hover:bg-emerald-600 border border-emerald-600 active:scale-95'
                                  : status === 'ABSENT'
                                  ? 'bg-rose-500 text-white shadow-xs hover:bg-rose-600 border border-rose-600 active:scale-95'
                                  : 'bg-slate-100 dark:bg-slate-800/90 text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-slate-700 hover:border-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                              }`}
                            >
                              {status === 'PRESENT' ? 'P' : status === 'ABSENT' ? 'A' : 'NA'}
                            </button>
                          </td>
                        );
                      })}

                      {/* Present Count */}
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10 border-l border-r border-slate-200/60 dark:border-slate-700/60 tabular-nums">
                        {countP}
                      </td>

                      {/* Absent Count */}
                      <td className="py-2.5 px-3 text-center font-bold text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10 border-r border-slate-200/60 dark:border-slate-700/60 tabular-nums">
                        {countA}
                      </td>

                      {/* Percentage */}
                      <td className="py-2.5 px-3 text-center font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10 tabular-nums text-xs">
                        {pct !== null ? `${pct}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer Total Summary Row */}
              <tfoot>
                <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <td colSpan={2} className="py-2.5 px-4 text-right font-black uppercase tracking-wider sticky left-0 z-10 bg-slate-50 dark:bg-slate-800 border-r border-slate-200/60 dark:border-slate-700/60">
                    Daily Present Total:
                  </td>

                  {monthDays.map((day) => {
                    let dayPresentCount = 0;
                    students.forEach((st) => {
                      if (gridData[st.id]?.[day.dateStr] === 'PRESENT') {
                        dayPresentCount++;
                      }
                    });

                    return (
                      <td
                        key={day.dateStr}
                        className="py-2 px-1 text-center font-bold text-emerald-600 dark:text-emerald-400 border-r border-slate-200/40 dark:border-slate-700/40 tabular-nums text-[11px]"
                      >
                        {dayPresentCount > 0 ? dayPresentCount : '-'}
                      </td>
                    );
                  })}

                  <td colSpan={3} className="py-2 px-3 text-center text-slate-400 font-normal text-[10px]">
                    Monthly Register
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Helpful Hint Footer */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-2">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span>
          Click on any cell to cycle in order: <strong>NA (grey)</strong> &rarr; <strong>P (green)</strong> &rarr; <strong>A (red)</strong> &rarr; <strong>NA (grey)</strong>. Click <strong>Save Attendance</strong> at the top right to store your changes.
        </span>
      </div>
    </div>
  );
};
