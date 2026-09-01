import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Award,
  Clock,
  Layers,
  ArrowRight,
  BookOpen,
  Download,
  HelpCircle,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/common/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { studentApi, attendanceApi, paymentApi, assignmentApi, resultApi } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { Student, Assignment, Result } from '../../types';

export const StudentDashboard: React.FC = () => {
  const { formatCurrency } = useSettings();
  const [profile, setProfile] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [fees, setFees] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const [profRes, attRes, feeRes, assignRes, resRes] = await Promise.all([
          studentApi.getMyProfile().catch(() => ({ data: { data: null } })),
          attendanceApi.getMyAttendance().catch(() => ({ data: { data: null } })),
          paymentApi.getMyFees().catch(() => ({ data: { data: null } })),
          assignmentApi.getMyAssignments().catch(() => ({ data: { data: [] } })),
          resultApi.getMyResults().catch(() => ({ data: { data: [] } })),
        ]);

        setProfile(profRes.data?.data);
        setAttendance(attRes.data?.data);
        setFees(feeRes.data?.data);
        setAssignments(assignRes.data?.data || []);
        setResults(resRes.data?.data || []);
      } catch (err) {
        console.error('Student dashboard error', err);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, []);

  if (loading) return <LoadingSkeleton count={6} />;

  const attendancePct = attendance?.stats?.percentage ?? profile?.attendancePercentage ?? 0;
  const pendingFee = fees?.pendingFee ?? profile?.pendingFee ?? 0;
  const totalFee = fees?.totalFee ?? profile?.totalFee ?? 0;
  const paidFee = fees?.paidFee ?? profile?.paidFee ?? 0;
  const studentName = profile ? `${profile.firstName} ${profile.lastName}` : 'Student';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <PageHeader
        title={`Hello, ${studentName}!`}
        subtitle={`${profile?.course?.name || 'Academic Cohort'} • Batch: ${profile?.batch?.name || 'Pending Allocation'}`}
        badge={profile?.studentId || 'STU-2026-0001'}
        actions={
          <>
            <Link to="/student/exams">
              <Button variant="primary" size="sm" leftIcon={FileSpreadsheet}>
                My Exams
              </Button>
            </Link>
            <Link to="/materials">
              <Button variant="secondary" size="sm" leftIcon={Download}>
                DPPs & Notes
              </Button>
            </Link>
          </>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attendance Rate"
          value={`${attendancePct}%`}
          subtitle={`${attendance?.stats?.present || 0} sessions present`}
          icon={CalendarCheck}
          colorScheme="emerald"
        />
        <StatCard
          title="Tuition Fee Status"
          value={pendingFee === 0 ? 'Settled' : formatCurrency(pendingFee)}
          subtitle={pendingFee === 0 ? 'No pending balance' : `Paid ${formatCurrency(paidFee)} of ${formatCurrency(totalFee)}`}
          icon={CreditCard}
          colorScheme={pendingFee === 0 ? 'emerald' : 'amber'}
        />
        <StatCard
          title="Active Assignments"
          value={assignments.length}
          subtitle="Problem sets & homework"
          icon={FileText}
          colorScheme="purple"
        />
        <StatCard
          title="Evaluated Exams"
          value={results.length}
          subtitle="AIR scorecards recorded"
          icon={Award}
          colorScheme="blue"
        />
      </div>

      {/* Main Grid: My Cohort & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Enrolled Batch & Timetable Schedule */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                My Cohort & Class Schedule
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assigned batch room, faculty mentors, and weekly lecture times
              </p>
            </div>
            <Link
              to="/student/my-batch"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Batch Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {profile?.batch ? (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {profile.batch.batchId}
                </span>
                <Badge variant="success" size="xs">Active Cohort</Badge>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{profile.batch.name}</h4>
                <p className="text-xs text-slate-500">{profile.course?.name}</p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> {profile.batch.classroom}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" /> {profile.batch.startTime} - {profile.batch.endTime}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <BookOpen className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Day 1 Session: Pending Batch Allocation
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                The Institute Administrator will assign your course section and weekly timetable shortly.
              </p>
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Learning Hub */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Student Quick Hub
          </h3>
          <div className="space-y-2">
            <Link
              to="/materials"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Daily Practice DPPs</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/doubts"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Ask Faculty a Doubt</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/student/fees"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Fee Invoices & Receipts</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
