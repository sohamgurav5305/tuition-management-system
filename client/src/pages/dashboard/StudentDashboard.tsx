import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  CreditCard,
  FileText,
  Download,
  HelpCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Clock,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { BarChart, BarDataPoint } from '../../components/charts/BarChart';
import { DonutChart, DonutSegment } from '../../components/charts/DonutChart';
import { ProgressRing } from '../../components/charts/ProgressRing';
import { useAuth } from '../../context/AuthContext';
import { reportApi } from '../../services/api';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const [studentSummary, setStudentSummary] = useState<{
    totalRevenue?: number;
    totalFeeObligation?: number;
    totalPendingFees?: number;
    attendanceAverage?: number;
    openAssignments?: number;
  } | null>(null);

  const [weeklyAttendance, setWeeklyAttendance] = useState<BarDataPoint[]>([
    { label: 'Mon', value: 100, subLabel: 'Present' },
    { label: 'Tue', value: 100, subLabel: 'Present' },
    { label: 'Wed', value: 100, subLabel: 'Present' },
    { label: 'Thu', value: 0, subLabel: 'Absent' },
    { label: 'Fri', value: 100, subLabel: 'Present' },
    { label: 'Sat', value: 100, subLabel: 'Present' },
  ]);

  useEffect(() => {
    reportApi.getDashboardSummary()
      .then((res) => {
        if (res.data?.data) {
          setStudentSummary(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const totalFee = studentSummary?.totalFeeObligation || 45000;
  const paidFee = studentSummary?.totalRevenue || 30000;
  const pendingFee = studentSummary?.totalPendingFees || Math.max(0, totalFee - paidFee);
  const feePct = totalFee > 0 ? Math.round((paidFee / totalFee) * 100) : 100;
  const attPct = studentSummary?.attendanceAverage || 94;

  const feeSegments: DonutSegment[] = [
    { label: 'Paid Fee', value: paidFee, color: '#10b981' },
    { label: 'Pending Dues', value: pendingFee, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6 sm:space-y-7 animate-fadeIn pb-8">
      {/* 1. Dashboard Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Student Learning Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Attendance punctuality, assignment submissions, doubts, and fee ledger
          </p>
        </div>

        {/* Right Date Range Pill */}
        <div className="flex items-center gap-2.5">
          <button
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span>May 18 – Jun 16, 2025</span>
            <span className="text-slate-400">📅</span>
          </button>
        </div>
      </div>

      {/* 2. Student Academic Status Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Attendance Rate"
          value={`${Math.round(attPct)}%`}
          icon={CalendarCheck}
          colorScheme="emerald"
          trend={{
            value: `${Math.round(attPct)}%`,
            isPositive: attPct >= 85,
            comparisonPeriod: 'Safe Zone (>85%)',
          }}
        />
        <StatCard
          title="Open Homework"
          value={studentSummary?.openAssignments ?? '3'}
          icon={FileText}
          colorScheme="purple"
          trend={{
            value: '3 Due',
            isPositive: false,
            comparisonPeriod: 'To Submit',
          }}
        />
        <StatCard
          title="Mentorship Doubts"
          value="1-on-1"
          icon={HelpCircle}
          colorScheme="indigo"
          trend={{
            value: 'Active',
            isPositive: true,
            comparisonPeriod: 'Ask Faculty',
          }}
        />
        <StatCard
          title="Fee Clearance"
          value={`${feePct}%`}
          icon={CreditCard}
          colorScheme="amber"
          trend={{
            value: `${feePct}%`,
            isPositive: pendingFee === 0,
            comparisonPeriod: pendingFee > 0 ? `₹${pendingFee.toLocaleString()} Due` : 'Fully Cleared',
          }}
        />
      </div>

      {/* 2. Interactive Personal Learning Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Left: 6-Day Attendance Presence Chart */}
        <div className="lg:col-span-2">
          <BarChart
            title="Classroom Attendance History"
            subtitle="Daily class attendance & punctuality record"
            data={weeklyAttendance}
            colorScheme="emerald"
            valueSuffix="%"
          />
        </div>

        {/* Right: Fee Payment Realization */}
        <div>
          <DonutChart
            title="Tuition Fee Ledger"
            subtitle="Agreed fee vs paid receipts"
            segments={feeSegments}
            centerMetric={`${feePct}%`}
            centerLabel="Cleared"
            valuePrefix="₹"
          />
        </div>
      </div>

      {/* 3. Student Quick Action Hub & Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-colors">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Quick Learning Hub</span>
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              to="/student/assignments"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-violet-50/70 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-900 text-violet-700 dark:text-violet-300 hover:bg-violet-100/70 dark:hover:bg-violet-900/40 transition-all text-center group"
            >
              <FileText className="w-5 h-5 mb-1.5 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Submit HW</span>
            </Link>
            <Link
              to="/doubts"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 transition-all text-center group"
            >
              <HelpCircle className="w-5 h-5 mb-1.5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Ask Doubt</span>
            </Link>
            <Link
              to="/materials"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200/80 dark:border-cyan-900 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100/70 dark:hover:bg-cyan-900/40 transition-all text-center group"
            >
              <Download className="w-5 h-5 mb-1.5 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Download DPP</span>
            </Link>
            <Link
              to="/student/fees"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 transition-all text-center group"
            >
              <CreditCard className="w-5 h-5 mb-1.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Fee Receipts</span>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Student Academic Portal & Notices</span>
              </h4>
              <Link to="/notifications" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                View All Notices <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Stay ahead with regular practice sheets, track your daily class attendance, submit assignment solutions on time, and communicate with your instructors.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    Attendance Standing
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">85%+ required for exam eligibility</p>
                </div>
                <ProgressRing
                  percentage={attPct}
                  size={46}
                  strokeWidth={5}
                  colorScheme="emerald"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    Homework Completion
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Solved & submitted on time</p>
                </div>
                <ProgressRing
                  percentage={88}
                  size={46}
                  strokeWidth={5}
                  colorScheme="purple"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

