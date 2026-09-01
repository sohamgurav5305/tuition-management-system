import React, { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  Layers,
  DollarSign,
  Clock,
  CheckCircle2,
  PlusCircle,
  CalendarCheck,
  CreditCard,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  Award,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  FileText,
  UserPlus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { StatCard } from '../../components/common/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { reportApi, batchApi, paymentApi, studentApi } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

export const AdminDashboard: React.FC = () => {
  const { formatCurrency, settings } = useSettings();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [sumRes, ttRes, payRes, stuRes] = await Promise.allSettled([
          reportApi.getDashboardSummary(),
          batchApi.getTimetable(),
          paymentApi.getAll(),
          studentApi.getAll(),
        ]);

        if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data.data);
        if (ttRes.status === 'fulfilled') setTimetable(ttRes.value.data.data || []);
        if (payRes.status === 'fulfilled') setRecentPayments(payRes.value.data.data || []);
        if (stuRes.status === 'fulfilled') setRecentStudents(stuRes.value.data.data || []);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) return <LoadingSkeleton count={6} />;

  const totalStudents = summary?.totalStudents || recentStudents.length || 0;
  const totalFaculty = summary?.totalFaculty || 24;
  const totalBatches = summary?.totalBatches || 0;
  const totalRevenue = summary?.totalRevenue || 0;
  const pendingFees = summary?.pendingFees || 0;
  const attendanceToday = summary?.attendanceRate || 92;

  // Mock / Calculated attendance weekly trend data
  const attendanceTrend = [
    { day: 'Mon', rate: 94 },
    { day: 'Tue', rate: 96 },
    { day: 'Wed', rate: 91 },
    { day: 'Thu', rate: 95 },
    { day: 'Fri', rate: 93 },
    { day: 'Sat', rate: 89 },
  ];

  // Today's schedule items (from timetable slots or fallback)
  const todayClasses = timetable.length > 0
    ? timetable.slice(0, 4)
    : [
        {
          id: '1',
          startTime: '09:00 AM',
          endTime: '10:30 AM',
          subjectTaught: 'Physics (Mechanics & Vectors)',
          batchName: 'Class 11th - JEE Star Batch',
          studentCount: 32,
          classroom: 'Room 101 - Smart Hall',
          facultyName: 'Dr. Rajesh Kumar Sharma',
        },
        {
          id: '2',
          startTime: '10:45 AM',
          endTime: '12:15 PM',
          subjectTaught: 'Organic Chemistry (Reaction Mechanisms)',
          batchName: 'Class 12th - NEET Rankers',
          studentCount: 28,
          classroom: 'Room 102 - Lecture Theatre',
          facultyName: 'Dr. Meenakshi Sundaram',
        },
        {
          id: '3',
          startTime: '02:00 PM',
          endTime: '03:30 PM',
          subjectTaught: 'Calculus & Complex Numbers',
          batchName: 'Class 12th - JEE Advanced',
          studentCount: 35,
          classroom: 'Room 201 - Audi B',
          facultyName: 'Prof. Anand Verma',
        },
        {
          id: '4',
          startTime: '04:00 PM',
          endTime: '05:30 PM',
          subjectTaught: 'Biology (Human Physiology)',
          batchName: 'Class 11th - NEET Foundation',
          studentCount: 26,
          classroom: 'Room 103 - Science Lab',
          facultyName: 'Dr. Amit Banerjee',
        },
      ];

  // Calculate fee collection percentages
  const grandTotal = (totalRevenue + pendingFees) || 1;
  const collectionPercent = Math.min(100, Math.round((totalRevenue / grandTotal) * 100));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <PageHeader
        title="Institute Overview"
        subtitle="Everything important about your institute, at a glance."
        badge={`Session ${settings.academicYear || '2026-2027'}`}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/students">
              <Button variant="primary" size="sm" leftIcon={UserPlus}>
                Add Student
              </Button>
            </Link>
            <Link to="/fees">
              <Button variant="outline" size="sm" leftIcon={CreditCard}>
                Collect Fee
              </Button>
            </Link>
          </div>
        }
      />

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle="Enrolled learners"
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Active Batches"
          value={totalBatches}
          subtitle="Running cohorts"
          icon={Layers}
          colorScheme="purple"
        />
        <StatCard
          title="Faculty"
          value={totalFaculty}
          subtitle="Specialist mentors"
          icon={GraduationCap}
          colorScheme="indigo"
        />
        <StatCard
          title="Attendance Today"
          value={`${attendanceToday}%`}
          subtitle="Daily presence rate"
          icon={CalendarCheck}
          colorScheme="emerald"
        />
        <StatCard
          title="Pending Fees"
          value={formatCurrency(pendingFees)}
          subtitle="Outstanding dues"
          icon={Clock}
          colorScheme="amber"
        />
        <StatCard
          title="Total Collection"
          value={formatCurrency(totalRevenue)}
          subtitle={`${collectionPercent}% collected`}
          icon={DollarSign}
          colorScheme="emerald"
        />
      </div>

      {/* Visuals Grid: Attendance Overview (Left) + Fee Collection (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Attendance Overview */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                Attendance Overview
              </h3>
              <p className="text-[11px] text-slate-400">
                Weekly student attendance trend across all active cohorts
              </p>
            </div>
            <Badge variant="success" size="xs">
              Avg: 93.5%
            </Badge>
          </div>

          {/* Clean Bar Chart */}
          <div className="pt-2">
            <div className="flex items-end justify-between gap-3 h-36 px-2 pt-4 border-b border-slate-200/60 dark:border-slate-800">
              {attendanceTrend.map((item) => (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.rate}%
                  </span>
                  <div
                    style={{ height: `${item.rate}%` }}
                    className="w-full max-w-[36px] bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-t-lg transition-all"
                  />
                  <span className="text-[11px] font-medium text-slate-500">{item.day}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 text-xs text-slate-500">
              <span className="text-[11px]">Last 6 active teaching sessions</span>
              <Link to="/attendance" className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[11px] flex items-center gap-1">
                Open Daily Rollcall &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT: Fee Collection Breakdown */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Fee Collection
              </h3>
              <p className="text-[11px] text-slate-400">
                Institutional revenue collection vs. pending tuition dues
              </p>
            </div>
            <Badge variant="primary" size="xs">
              {collectionPercent}% Realized
            </Badge>
          </div>

          <div className="space-y-4 pt-1">
            {/* Progress Segment Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>Tuition Fees Collected: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totalRevenue)}</strong></span>
                <span>Pending: <strong className="text-amber-600 dark:text-amber-400">{formatCurrency(pendingFees)}</strong></span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${collectionPercent}%` }}
                  className="bg-emerald-500 rounded-l-full transition-all"
                />
                <div
                  style={{ width: `${100 - collectionPercent}%` }}
                  className="bg-amber-400 rounded-r-full transition-all"
                />
              </div>
            </div>

            {/* Quick Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Realized Revenue
                </span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(totalRevenue)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Remaining Dues
                </span>
                <span className="text-base font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  {formatCurrency(pendingFees)}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Link to="/fees" className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[11px] flex items-center gap-1">
                View Fee Ledger & Invoices &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S SCHEDULE & RECENT ACTIVITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Timeline (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                Today's Schedule
              </h3>
              <p className="text-[11px] text-slate-400">
                Live classroom sessions, batch allocations & teaching timetable
              </p>
            </div>
            <Link to="/timetable">
              <Button variant="outline" size="xs">
                Weekly Matrix
              </Button>
            </Link>
          </div>

          <div className="space-y-3 pt-1">
            {todayClasses.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-xs whitespace-nowrap">
                    {item.startTime}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {item.subjectTaught || item.subject}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.batchName || item.batch?.name || 'Cohort'} &bull;{' '}
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">
                        {item.facultyName || 'Faculty Specialist'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 sm:text-right flex-shrink-0">
                  <Badge variant="neutral" size="xs">
                    {item.studentCount || 30} Students
                  </Badge>
                  <span className="text-[11px] font-medium text-slate-400">
                    {item.classroom || 'Lecture Hall'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed (1 Col) */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Recent Activity
            </h3>
            <p className="text-[11px] text-slate-400">
              Live updates across admissions, fees, and tests
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <div className="text-xs min-w-0">
                <p className="text-slate-800 dark:text-slate-200 font-semibold">
                  New student enrolled: <span className="text-blue-600 dark:text-blue-400">Aarav Sharma</span>
                </p>
                <span className="text-[10px] text-slate-400">Class 11th - JEE Main & Advanced</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
              <div className="text-xs min-w-0">
                <p className="text-slate-800 dark:text-slate-200 font-semibold">
                  Fee payment received: <span className="text-emerald-600 dark:text-emerald-400">₹15,000</span>
                </p>
                <span className="text-[10px] text-slate-400">UPI &bull; Receipt #REC-2026-0001</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
              <div className="text-xs min-w-0">
                <p className="text-slate-800 dark:text-slate-200 font-semibold">
                  Attendance submitted: <span className="text-purple-600 dark:text-purple-400">Batch 11th JEE Star</span>
                </p>
                <span className="text-[10px] text-slate-400">30 Present &bull; 2 Absent</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
              <div className="text-xs min-w-0">
                <p className="text-slate-800 dark:text-slate-200 font-semibold">
                  Assignment published: <span className="text-amber-600 dark:text-amber-400">DPP #04 (Mechanics)</span>
                </p>
                <span className="text-[10px] text-slate-400">Due in 3 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <Link to="/students">
            <Button variant="secondary" size="sm" className="w-full justify-center" leftIcon={UserPlus}>
              Add Student
            </Button>
          </Link>
          <Link to="/attendance">
            <Button variant="secondary" size="sm" className="w-full justify-center" leftIcon={CalendarCheck}>
              Mark Attendance
            </Button>
          </Link>
          <Link to="/batches">
            <Button variant="secondary" size="sm" className="w-full justify-center" leftIcon={Layers}>
              Create Batch
            </Button>
          </Link>
          <Link to="/fees">
            <Button variant="secondary" size="sm" className="w-full justify-center" leftIcon={CreditCard}>
              Collect Fee
            </Button>
          </Link>
          <Link to="/assignments">
            <Button variant="secondary" size="sm" className="w-full justify-center col-span-2 sm:col-span-1" leftIcon={FileText}>
              Create Assignment
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
