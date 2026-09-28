import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  CalendarCheck,
  FileText,
  Download,
  HelpCircle,
  Users,
  CheckCircle2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { BarChart, BarDataPoint } from '../../components/charts/BarChart';
import { DonutChart, DonutSegment } from '../../components/charts/DonutChart';
import { ProgressRing } from '../../components/charts/ProgressRing';
import { useAuth } from '../../context/AuthContext';
import { reportApi } from '../../services/api';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState<{
    totalBatches?: number;
    openDoubts?: number;
    pendingAssignments?: number;
    totalStudents?: number;
  } | null>(null);

  const [weeklyAttendance, setWeeklyAttendance] = useState<BarDataPoint[]>([
    { label: 'Mon', value: 92, subLabel: '92% Present' },
    { label: 'Tue', value: 88, subLabel: '88% Present' },
    { label: 'Wed', value: 95, subLabel: '95% Present' },
    { label: 'Thu', value: 91, subLabel: '91% Present' },
    { label: 'Fri', value: 89, subLabel: '89% Present' },
    { label: 'Sat', value: 94, subLabel: '94% Present' },
  ]);

  useEffect(() => {
    reportApi.getDashboardSummary()
      .then((res) => {
        if (res.data?.data) {
          setStats(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Homework submission segments
  const homeworkSegments: DonutSegment[] = [
    { label: 'Graded', value: 42, color: '#10b981' },
    { label: 'Awaiting Grading', value: stats?.pendingAssignments || 8, color: '#8b5cf6' },
    { label: 'Pending Submissions', value: 14, color: '#f59e0b' },
  ];

  const totalAssignedStudents = stats?.totalStudents ?? 48;
  const activeBatchesCount = stats?.totalBatches ?? 3;
  const openDoubtsCount = stats?.openDoubts ?? 2;

  return (
    <div className="space-y-6 sm:space-y-7 animate-fadeIn pb-8">
      {/* 1. Dashboard Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Faculty Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Classroom batches, learner attendance, and homework evaluation
          </p>
        </div>

        {/* Right Date Range Pill & Filters Button */}
        <div className="flex items-center gap-2.5">
          <button
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span>May 18 – Jun 16, 2025</span>
            <span className="text-slate-400">📅</span>
          </button>
        </div>
      </div>

      {/* 2. Faculty Operational Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Teaching Batches"
          value={activeBatchesCount}
          icon={Layers}
          colorScheme="indigo"
          trend={{
            value: '3 Active',
            isPositive: true,
            comparisonPeriod: 'All Assigned',
          }}
        />
        <StatCard
          title="Enrolled Learners"
          value={totalAssignedStudents}
          icon={Users}
          colorScheme="blue"
          trend={{
            value: '100%',
            isPositive: true,
            comparisonPeriod: 'Active Roster',
          }}
        />
        <StatCard
          title="Pending Homework"
          value={stats?.pendingAssignments ?? '5'}
          icon={FileText}
          colorScheme="purple"
          trend={{
            value: '5 Pending',
            isPositive: false,
            comparisonPeriod: 'Awaiting Grading',
          }}
        />
        <StatCard
          title="Student Doubts"
          value={openDoubtsCount > 0 ? `${openDoubtsCount} Open` : 'Resolved'}
          icon={HelpCircle}
          colorScheme="emerald"
          trend={{
            value: openDoubtsCount > 0 ? `${openDoubtsCount} New` : 'All Clear',
            isPositive: openDoubtsCount === 0,
            comparisonPeriod: '1-on-1 Mentorship',
          }}
        />
      </div>

      {/* 2. Interactive Classroom Performance & Homework Status Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Left: 6-Day Batch Attendance Bar Chart */}
        <div className="lg:col-span-2">
          <BarChart
            title="Weekly Classroom Attendance Trends"
            subtitle="Daily presence percentage across assigned batches"
            data={weeklyAttendance}
            colorScheme="emerald"
            valueSuffix="%"
          />
        </div>

        {/* Right: Homework Grading Distribution */}
        <div>
          <DonutChart
            title="Homework & DPP Submissions"
            subtitle="Evaluation status across active assignments"
            segments={homeworkSegments}
            centerMetric="64"
            centerLabel="Submissions"
          />
        </div>
      </div>

      {/* 3. Classroom Actions & Mentorship Health Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-4">
        {/* Left: Quick Actions Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-colors flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Classroom Actions</span>
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/attendance"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-all text-center group"
              >
                <CalendarCheck className="w-5 h-5 mb-1.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Mark Attendance</span>
              </Link>
              <Link
                to="/assignments"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 transition-all text-center group"
              >
                <FileText className="w-5 h-5 mb-1.5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">New Homework</span>
              </Link>
              <Link
                to="/materials"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200/80 dark:border-cyan-900 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100/70 dark:hover:bg-cyan-900/40 transition-all text-center group"
              >
                <Download className="w-5 h-5 mb-1.5 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Upload DPP</span>
              </Link>
              <Link
                to="/doubts"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-all text-center group"
              >
                <HelpCircle className="w-5 h-5 mb-1.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Solve Doubts</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Faculty Mentorship & Doubts Overview */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Faculty Mentorship & Batches Overview</span>
              </h4>
              <Link to="/teacher/batches" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                View My Batches <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Manage student doubts, track homework submission timelines, evaluate scorecards, and review student leave requests.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Live Doubts Resolution</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {openDoubtsCount > 0 ? `${openDoubtsCount} student questions awaiting reply` : 'All doubts cleared'}
                  </p>
                </div>
                <ProgressRing
                  percentage={openDoubtsCount > 0 ? 75 : 100}
                  size={46}
                  strokeWidth={5}
                  colorScheme="purple"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Attendance Average</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Across assigned batch registers</p>
                </div>
                <ProgressRing
                  percentage={92}
                  size={46}
                  strokeWidth={5}
                  colorScheme="emerald"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

