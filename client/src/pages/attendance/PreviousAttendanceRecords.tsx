import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Layers,
  Printer,
  Search,
  FileSpreadsheet,
} from 'lucide-react';
import { attendanceApi, batchApi } from '../../services/api';
import { Batch } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { printAttendanceReport } from '../../utils/printAttendanceReport';

interface StudentSummary {
  studentId: string;
  studentCustomId: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  totalLecturesConducted: number;
  totalAttended: number;
  totalPresent: number;
  totalAbsent: number;
  overallPercentage: number;
  subjects: Record<
    string,
    {
      totalLectures: number;
      attended: number;
      present: number;
      absent: number;
      percentage: number;
    }
  >;
}

interface AttendanceRangeData {
  batch: {
    id: string;
    batchId: string;
    name: string;
    courseName: string;
  };
  startDate: string;
  endDate: string;
  totalLecturesConducted: number;
  allSubjects: string[];
  subjectLecturesMap: Record<string, number>;
  students: StudentSummary[];
}

export const PreviousAttendanceRecords: React.FC = () => {
  const { error } = useToast();
  const { settings, formatDate } = useSettings();

  const getThirtyDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  };

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(getThirtyDaysAgo());
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<AttendanceRangeData | null>(null);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res = await batchApi.getAll({ status: 'ACTIVE' });
        const list: Batch[] = res.data.data;
        setBatches(list);
        if (list.length > 0) {
          setSelectedBatchId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load batches', err);
      }
    };
    loadBatches();
  }, []);

  const handleFetchRecords = async (showLoading = false) => {
    if (!selectedBatchId) {
      if (showLoading) error('Selection Required', 'Please select a batch.');
      return;
    }
    if (startDate > endDate) {
      if (showLoading) error('Invalid Date Range', 'From Date cannot be later than To Date.');
      return;
    }

    setLoading(true);
    try {
      const res = await attendanceApi.getAttendanceRange(
        selectedBatchId,
        startDate,
        endDate
      );
      setReportData(res.data.data);
    } catch (err: any) {
      error('Fetch Failed', err.response?.data?.message || 'Could not fetch historical attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBatchId && startDate && endDate && startDate <= endDate) {
      handleFetchRecords(false);
    }
  }, [selectedBatchId]);

  const handlePrint = () => {
    if (!reportData) return;
    printAttendanceReport({ ...reportData, settings });
  };

  const filteredStudents = (reportData?.students || []).filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const customId = (s.studentCustomId || '').toLowerCase();
    const roll = (s.rollNumber || '').toLowerCase();
    return fullName.includes(q) || customId.includes(q) || roll.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Batch Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Select Batch:
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900 dark:text-slate-100"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.course?.name || 'Academic'})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              From Date:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              To Date:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Student by Name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={Printer}
              onClick={handlePrint}
              disabled={!reportData || reportData.students.length === 0}
            >
              Print Attendance
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Search}
              isLoading={loading}
              onClick={() => handleFetchRecords(true)}
            >
              Fetch Records
            </Button>
          </div>
        </div>
      </div>

      {loading && <LoadingSkeleton count={4} />}

      {/* Printable Report Header */}
      {reportData && !loading && (
        <div className="space-y-6">
          {/* Printable Institute Header */}
          <div className="hidden print:block text-center border-b pb-4 mb-4">
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
              {settings?.instituteName || 'Apex Career Institute'}
            </h1>
            <p className="text-xs text-slate-500">
              Attendance Record • Batch: {reportData.batch.name} ({reportData.batch.courseName})
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Date Period: {formatDate(reportData.startDate)} to {formatDate(reportData.endDate)} &bull; Total Lectures Conducted: {reportData.totalLecturesConducted}
            </p>
          </div>

          {/* Main Attendance Records Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden print:border-none print:shadow-none">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Subject-wise Attendance & Overall Percentage
                </h3>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                Showing {filteredStudents.length} of {reportData.students.length} students
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">Student Name & ID</th>
                    {reportData.allSubjects.map((subj) => (
                      <th key={subj} className="py-3.5 px-3 text-center">
                        {subj}
                        <span className="block font-normal text-[9px] text-slate-400 normal-case">
                          ({reportData.subjectLecturesMap[subj] || 0} Lectures)
                        </span>
                      </th>
                    ))}
                    <th className="py-3.5 px-4 text-center">Total Attended</th>
                    <th className="py-3.5 px-4 text-center">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={reportData.allSubjects.length + 4}
                        className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs"
                      >
                        No student attendance records match the selected date range and filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const isGood = s.overallPercentage >= 75;
                      return (
                        <tr
                          key={s.studentId}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 text-slate-400 dark:text-slate-500 font-mono font-bold">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {s.firstName} {s.lastName}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {s.studentCustomId} {s.rollNumber ? `• Roll: ${s.rollNumber}` : ''}
                            </span>
                          </td>

                          {/* Subject-Wise Attended Lectures and Percentage */}
                          {reportData.allSubjects.map((subj) => {
                            const subjData = s.subjects[subj];
                            const totalSubj = subjData?.totalLectures || 0;
                            const attendedSubj = subjData?.attended || 0;
                            const pct = subjData?.percentage || 0;

                            return (
                              <td key={subj} className="py-3.5 px-3 text-center">
                                {totalSubj > 0 ? (
                                  <div>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                      {attendedSubj} / {totalSubj}
                                    </span>
                                    <span
                                      className={`block text-[10px] font-bold ${
                                        pct >= 75
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-amber-600 dark:text-amber-400'
                                      }`}
                                    >
                                      {pct}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600">-</span>
                                )}
                              </td>
                            );
                          })}

                          {/* Total Attended across all subjects */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-slate-100">
                            {s.totalAttended} / {s.totalLecturesConducted}
                          </td>

                          {/* Overall Percentage */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-xl text-xs font-black tabular-nums inline-block ${
                                isGood
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800'
                              }`}
                            >
                              {s.overallPercentage}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Print Footer with Signatures */}
            <div className="hidden print:flex justify-between items-end pt-12 px-6 pb-6 text-xs text-slate-600">
              <div>
                <p className="border-t border-slate-400 pt-1 font-bold">Class Teacher Signature</p>
              </div>
              <div className="text-right">
                <p className="border-t border-slate-400 pt-1 font-bold">Academic Director / Principal</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Date of Issue: {formatDate(new Date())}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
