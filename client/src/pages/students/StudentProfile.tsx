import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  Edit,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  FileText,
  DollarSign,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { studentApi, paymentApi } from '../../services/api';
import { Student, Payment, Attendance, Result } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { getMediaUrl } from '../../utils/media';
import { StudentFormModal } from './StudentFormModal';
import { CollectPaymentModal } from '../fees/CollectPaymentModal';
import { AssignFeeModal } from '../fees/AssignFeeModal';
import { ReceiptModal } from '../../components/common/ReceiptModal';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatCurrency, formatDate } = useSettings();
  const { user } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'fees' | 'assignments'>('overview');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const isTeacher = user?.role === 'TEACHER';
  const isAccountant = user?.role === 'ACCOUNTANT';
  const canEdit = user?.role === 'ADMINISTRATOR';

  const fetchStudent = async (showLoading = false) => {
    if (!id) return;
    try {
      if (showLoading) setLoading(true);
      const res = await studentApi.getById(id);
      setStudent(res.data.data);
    } catch (err) {
      console.error('Failed to load student profile', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent(true);
    const interval = setInterval(() => {
      fetchStudent(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const attendanceStats = student?.attendanceStats || {
    total: student?.attendance?.length || 0,
    present: student?.attendance?.filter((a) => a.status === 'PRESENT').length || 0,
    absent: student?.attendance?.filter((a) => a.status === 'ABSENT').length || 0,
    percentage: student?.attendancePercentage ?? 0,
  };

  const subjectStatsList = React.useMemo(() => {
    if (!student) return [];
    const map = new Map<string, { total: number; present: number; absent: number; percentage: number }>();

    // First from attendanceStats.subjects if available from backend
    if (attendanceStats && (attendanceStats as any).subjects) {
      Object.entries((attendanceStats as any).subjects).forEach(([subj, st]: [string, any]) => {
        if (subj) {
          map.set(subj, {
            total: st.total || 0,
            present: st.present || 0,
            absent: st.absent || 0,
            percentage: st.percentage || 0,
          });
        }
      });
    }

    // Also scan student.attendance records if present
    if (student?.attendance && Array.isArray(student.attendance)) {
      student.attendance.forEach((att: any) => {
        const subj = att.subject || 'General';
        if (!map.has(subj)) {
          map.set(subj, { total: 0, present: 0, absent: 0, percentage: 0 });
        }
        if (!attendanceStats || !(attendanceStats as any).subjects || !(attendanceStats as any).subjects[subj]) {
          const current = map.get(subj)!;
          current.total += 1;
          if (att.status === 'PRESENT') current.present += 1;
          else if (att.status === 'ABSENT') current.absent += 1;
          current.percentage = current.total > 0 ? Number(((current.present / current.total) * 100).toFixed(1)) : 0;
        }
      });
    }

    // Also include course/batch subjects if not yet in map
    const potentialSubjects: string[] = [];
    if (student?.course?.subjects) {
      if (Array.isArray(student.course.subjects)) potentialSubjects.push(...student.course.subjects);
      else if (typeof student.course.subjects === 'string') {
        try {
          const parsed = JSON.parse(student.course.subjects);
          if (Array.isArray(parsed)) potentialSubjects.push(...parsed);
          else potentialSubjects.push(student.course.subjects);
        } catch {
          const split = student.course.subjects.split(',').map((s: string) => s.trim()).filter(Boolean);
          if (split.length > 0) {
            potentialSubjects.push(...split);
          } else {
            potentialSubjects.push(student.course.subjects);
          }
        }
      }
    }
    if (student?.batch?.subjectInstructors && Array.isArray(student.batch.subjectInstructors)) {
      student.batch.subjectInstructors.forEach((s: any) => {
        if (s?.subject) potentialSubjects.push(s.subject);
      });
    }

    potentialSubjects.forEach((s) => {
      if (s && !map.has(s)) {
        map.set(s, { total: 0, present: 0, absent: 0, percentage: 0 });
      }
    });

    return Array.from(map.entries()).map(([name, stat]) => ({
      name,
      ...stat,
    }));
  }, [student, attendanceStats]);

  if (loading) return <LoadingSkeleton count={6} />;
  if (!student) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm font-semibold text-slate-500">Student record not found.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/students')}>
          Back to Students
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(!isAccountant ? [{ id: 'attendance', label: 'Attendance' }] : []),
    ...(!isTeacher ? [{ id: 'fees', label: 'Fee Schedule' }] : []),
    ...(!isAccountant ? [{ id: 'assignments', label: 'Assignments' }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Student Roster
        </button>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={Edit}
              onClick={() => setIsEditOpen(true)}
            >
              Edit Profile
            </Button>
          )}
          {!isTeacher && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => setIsAssignOpen(true)}
            >
              Assign Fee / Fine
            </Button>
          )}
          {!isTeacher && (student.pendingFee || 0) > 0 && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={CreditCard}
              onClick={() => setIsPayOpen(true)}
            >
              Record Fee Payment
            </Button>
          )}
        </div>
      </div>

      {/* Main Student Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-black overflow-hidden flex-shrink-0 shadow-sm relative">
            <span className="select-none">{`${student.firstName?.[0] || 'S'}${student.lastName?.[0] || ''}`}</span>
            {student.avatarUrl && (
              <img
                src={getMediaUrl(student.avatarUrl)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {student.firstName} {student.lastName}
              </h1>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200/80 dark:border-blue-800">
                {student.studentId}
              </span>
              {!isAccountant && (
                <Badge variant={student.status === 'ACTIVE' ? 'success' : 'neutral'} size="xs" dot>
                  {student.status}
                </Badge>
              )}
            </div>

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Course: <span className="text-blue-600 dark:text-blue-400 font-bold">{student.course?.name || 'Unassigned Course'}</span> &bull; Batch: <span className="text-purple-600 dark:text-purple-400 font-bold">{student.batch?.name || 'Unassigned Batch'}</span>
            </p>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {student.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {student.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Admitted: {formatDate(student.admissionDate)}
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex md:flex-col items-center md:items-end gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
            {!isAccountant && (
              <div className="text-left md:text-right">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Attendance Rate</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {attendanceStats.percentage}%
                </span>
              </div>
            )}
            {!isTeacher && (
              <div className="text-left md:text-right">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Pending Fee Balance</span>
                <span
                  className={`text-lg font-black tabular-nums ${
                    (student.pendingFee || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {formatCurrency(student.pendingFee || 0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Academic & Personal Info
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Date of Birth:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDate(student.dateOfBirth)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Gender:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{student.gender}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Residential Address:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-right max-w-xs">{student.address}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Course Enrolled:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{student.course?.name || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Guardian Details
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Primary Guardian:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{student.guardianName}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Relationship:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{student.guardianRelation}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Guardian Contact:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{student.guardianPhone}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Emergency Contact:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{student.emergencyContact || 'Same as primary'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance */}
      {!isAccountant && activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Overall Attendance Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Overall Attendance Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Lectures</span>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tabular-nums">{attendanceStats.total}</p>
              </div>
              <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60 text-center">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Present</span>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 tabular-nums">{attendanceStats.present}</p>
              </div>
              <div className="p-4 bg-rose-50/80 dark:bg-rose-950/40 rounded-2xl border border-rose-200/60 dark:border-rose-800/60 text-center">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Absent</span>
                <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1 tabular-nums">{attendanceStats.absent}</p>
              </div>
            </div>
          </div>

          {/* Subject-wise Attendance */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Subject-wise Attendance
            </h3>

            {subjectStatsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3 text-center">Total Lectures</th>
                      <th className="px-4 py-3 text-center">Present</th>
                      <th className="px-4 py-3 text-center">Absent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {subjectStatsList.map((subj) => (
                      <tr key={subj.name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                          {subj.name}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                          <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                            {subj.total}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                          <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60">
                            {subj.present}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-rose-700 dark:text-rose-300 tabular-nums">
                          <span className="inline-block px-3 py-1 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200/60 dark:border-rose-800/60">
                            {subj.absent}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No subject-wise attendance recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Fees */}
      {!isTeacher && activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-500 dark:text-slate-400">Agreed Course Tuition</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1 tabular-nums">{formatCurrency(student.totalFee)}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Paid Amount</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{formatCurrency(student.paidFee)}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
              <span className="text-xs text-rose-600 dark:text-rose-400">Pending Balance</span>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 tabular-nums">{formatCurrency(student.pendingFee)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Payment Receipts History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {student.payments && student.payments.length > 0 ? (
                    student.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">{p.receiptId}</td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral" size="xs">{p.paymentMode}</Badge>
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">{formatDate(p.paymentDate)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Assignments */}
      {activeTab === 'assignments' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Assignment Problem Sets 
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Assignment Title</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Submission Status</th>
                  <th className="px-4 py-3">Score / Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(student as any).submissions && (student as any).submissions.length > 0 ? (
                  (student as any).submissions.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{sub.assignment?.title}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{sub.assignment?.subject}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">{formatDate(sub.assignment?.dueDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="success" size="xs" dot>Submitted</Badge>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        {sub.marksObtained ?? 'Pending Eval'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                      No assignment submissions recorded yet for this session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {canEdit && (
        <StudentFormModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={fetchStudent}
          initialStudent={student}
        />
      )}

      {/* Payment Modal */}
      {!isTeacher && (
        <CollectPaymentModal
          isOpen={isPayOpen}
          onClose={() => setIsPayOpen(false)}
          onSuccess={fetchStudent}
          student={student}
        />
      )}

      {/* Assign Fee Modal */}
      {!isTeacher && (
        <AssignFeeModal
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          onSuccess={fetchStudent}
          initialStudent={student}
        />
      )}

      {/* Official Printable Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          payment={selectedReceipt}
        />
      )}
    </div>
  );
};
