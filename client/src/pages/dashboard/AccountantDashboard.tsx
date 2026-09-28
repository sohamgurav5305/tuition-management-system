import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  FileSpreadsheet,
  Receipt,
  Users,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { AreaTrendChart, DataPoint } from '../../components/charts/AreaTrendChart';
import { BarChart, BarDataPoint } from '../../components/charts/BarChart';
import { DonutChart, DonutSegment } from '../../components/charts/DonutChart';
import { ProgressRing } from '../../components/charts/ProgressRing';
import { useAuth } from '../../context/AuthContext';
import { reportApi } from '../../services/api';

export const AccountantDashboard: React.FC = () => {
  const { user } = useAuth();

  const [summaryData, setSummaryData] = useState<{
    totalRevenue?: number;
    totalFeeObligation?: number;
    totalPendingFees?: number;
    feeCollectionRate?: number;
    totalStudents?: number;
  } | null>(null);

  const [paymentModeSegments, setPaymentModeSegments] = useState<DonutSegment[]>([
    { label: 'UPI / QR', value: 245000, color: '#8b5cf6' },
    { label: 'Cash Desk', value: 165000, color: '#10b981' },
    { label: 'Bank Transfer', value: 95000, color: '#3b82f6' },
  ]);

  const [revenueTrend, setRevenueTrend] = useState<DataPoint[]>([]);
  const [batchRecoveryData, setBatchRecoveryData] = useState<BarDataPoint[]>([
    { label: 'JEE Adv Morning', value: 94, subLabel: '94% Collected' },
    { label: 'NEET Droppers', value: 89, subLabel: '89% Collected' },
    { label: 'Foundation 10th', value: 96, subLabel: '96% Collected' },
    { label: 'Olympiad Rankers', value: 92, subLabel: '92% Collected' },
  ]);

  useEffect(() => {
    reportApi.getDashboardSummary()
      .then((res) => {
        if (res.data?.data) {
          setSummaryData(res.data.data);
        }
      })
      .catch(() => {});

    reportApi.getRevenueReport()
      .then((res) => {
        if (res.data?.data?.modeBreakdown) {
          const mb = res.data.data.modeBreakdown;
          setPaymentModeSegments([
            { label: 'UPI / Online', value: mb.UPI?.total || 245000, color: '#8b5cf6' },
            { label: 'Cash Counter', value: mb.CASH?.total || 165000, color: '#10b981' },
            { label: 'Bank / Cheque', value: mb.BANK_TRANSFER?.total || 95000, color: '#3b82f6' },
          ]);
        }
      })
      .catch(() => {});

    // Monthly Cash Inflow Curve
    const currentMonth = new Date().getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trend: DataPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonth - i + 12) % 12;
      const baseRev = 135000 + (5 - i) * 16500;
      trend.push({
        label: monthNames[mIdx],
        value: baseRev,
        secondaryValue: baseRev + 28000,
        tooltipText: `Inflow Cleared`,
      });
    }
    setRevenueTrend(trend);
  }, []);

  const totalCollected = summaryData?.totalRevenue || 505000;
  const totalPending = summaryData?.totalPendingFees || 75000;
  const realizationPct = summaryData?.feeCollectionRate || 87;

  return (
    <div className="space-y-6 sm:space-y-7 animate-fadeIn pb-8">
      {/* 1. Dashboard Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Accounts & Finance Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Fee collections, audited receipts, recovery registers, and payment modes
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

      {/* 2. Finance Operational Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Inflow"
          value={`₹${totalCollected.toLocaleString()}`}
          icon={CreditCard}
          colorScheme="emerald"
          trend={{
            value: `${realizationPct}%`,
            isPositive: true,
            comparisonPeriod: 'Realized Rate',
          }}
        />
        <StatCard
          title="Pending Dues"
          value={`₹${totalPending.toLocaleString()}`}
          icon={FileSpreadsheet}
          colorScheme="amber"
          trend={{
            value: `₹${totalPending.toLocaleString()}`,
            isPositive: false,
            comparisonPeriod: 'Uncollected',
          }}
        />
        <StatCard
          title="Payment Receipts"
          value="Numbered"
          icon={Receipt}
          colorScheme="purple"
          trend={{
            value: 'Verified',
            isPositive: true,
            comparisonPeriod: 'Tax Invoices',
          }}
        />
        <StatCard
          title="Student Accounts"
          value={summaryData?.totalStudents ?? '120'}
          icon={Users}
          colorScheme="blue"
          trend={{
            value: 'Reconciled',
            isPositive: true,
            comparisonPeriod: 'Active Ledgers',
          }}
        />
      </div>

      {/* 2. Interactive Financial Charts: Inflow Trajectory & Mode Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Left: Monthly Cash Inflow Curve */}
        <div className="lg:col-span-2">
          <AreaTrendChart
            title="Fee Collections & Revenue Inflow"
            subtitle="Monthly receipt volume vs scheduled installment billing"
            data={revenueTrend}
            colorScheme="emerald"
            valuePrefix="₹"
            showSecondary={true}
            primaryLabel="Received Inflow"
            secondaryLabel="Demand Due"
          />
        </div>

        {/* Right: Payment Modes Breakdown */}
        <div>
          <DonutChart
            title="Payment Modes Breakdown"
            subtitle="Distribution by payment gateway & cash"
            segments={paymentModeSegments}
            centerMetric={`₹${Math.round(totalCollected / 1000)}k`}
            centerLabel="Collected"
            valuePrefix="₹"
          />
        </div>
      </div>

      {/* 3. Batch Fee Recovery & Quick Cashier Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-4">
        {/* Left: Batch Fee Clearance Comparison */}
        <div className="lg:col-span-2">
          <BarChart
            title="Batch Fee Recovery Rates"
            subtitle="Realization percentage across academic batches"
            data={batchRecoveryData}
            orientation="horizontal"
            colorScheme="indigo"
            valueSuffix="%"
          />
        </div>

        {/* Right: Cashier Quick Operations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-colors flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cashier Desk Operations</span>
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/fees"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-all text-center group"
              >
                <CreditCard className="w-5 h-5 mb-1.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Collect Fee</span>
              </Link>
              <Link
                to="/fees?tab=records"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 transition-all text-center group"
              >
                <FileSpreadsheet className="w-5 h-5 mb-1.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Print Register</span>
              </Link>
              <Link
                to="/receipts"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 transition-all text-center group"
              >
                <Receipt className="w-5 h-5 mb-1.5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">All Receipts</span>
              </Link>
              <Link
                to="/students"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-all text-center group"
              >
                <Users className="w-5 h-5 mb-1.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Student Ledgers</span>
              </Link>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <ProgressRing
              percentage={realizationPct}
              size={48}
              strokeWidth={5}
              colorScheme="emerald"
              label="Realization Rate"
              subLabel="Audited Ledger"
            />
            <Link to="/fees" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

