import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  DollarSign,
  Clock,
  Download,
  Users,
  Layers,
  CheckCircle2,
  BookOpen,
  Receipt,
  CreditCard,
} from 'lucide-react';
import { reportApi } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';

type ReportTab = 'revenue' | 'pending' | 'batches' | 'courses';

export const ReportsPage: React.FC = () => {
  const { formatCurrency } = useSettings();
  const { user } = useAuth();
  const isAccountant = user?.role === 'ACCOUNTANT';

  const [activeTab, setActiveTab] = useState<ReportTab>('revenue');
  const [summary, setSummary] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const res = await reportApi.getDashboardSummary();
      setSummary(res.data.data);
    } catch (err) {
      console.error('Failed to load report summary', err);
    }
  };

  const fetchCurrentReport = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      if (activeTab === 'revenue') {
        const res = await reportApi.getRevenueReport();
        setReportData(res.data.data);
      } else if (activeTab === 'pending') {
        const res = await reportApi.getPendingFeesReport();
        setReportData(res.data.data);
      } else if (activeTab === 'batches') {
        const res = await reportApi.getBatchStrengthReport();
        setReportData(res.data.data);
      } else if (activeTab === 'courses') {
        const res = await reportApi.getCourseRevenueReport();
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch report data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchCurrentReport(true);
    const interval = setInterval(() => {
      fetchSummary();
      fetchCurrentReport(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const tabs: { id: ReportTab; label: string }[] = isAccountant
    ? [
        { id: 'revenue', label: 'Revenue & Collections' },
        { id: 'pending', label: 'Pending Fees & Dues' },
        { id: 'courses', label: 'Course Revenue Breakdown' },
      ]
    : [
        { id: 'revenue', label: 'Revenue & Collections' },
        { id: 'pending', label: 'Pending Fees & Dues' },
        { id: 'batches', label: 'Batch Strength & Occupancy' },
        { id: 'courses', label: 'Course Revenue Breakdown' },
      ];

  const getCsvExportType = () => {
    switch (activeTab) {
      case 'revenue': return 'revenue';
      case 'pending': return 'pending-fees';
      case 'batches': return 'batches';
      case 'courses': return 'courses';
      default: return 'revenue';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <PageHeader
        title={isAccountant ? 'Financial & Revenue Reports' : 'Reports & Analytics'}
        subtitle={
          isAccountant
            ? 'Comprehensive tuition fee collections, outstanding balance ledgers, and revenue stream analytics.'
            : 'Institute-level performance summaries, revenue streams, attendance statistics, and CSV data export.'
        }
        badge="Audit Ready"
        actions={
          <a href={reportApi.exportCsvUrl(getCsvExportType())} download>
            <Button variant="secondary" size="sm" leftIcon={Download}>
              Export {tabs.find((t) => t.id === activeTab)?.label} CSV
            </Button>
          </a>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Net Revenue"
          value={formatCurrency(summary?.totalRevenue || 0)}
          subtitle={`${summary?.feeCollectionRate || 0}% collection rate`}
          icon={DollarSign}
          colorScheme="emerald"
        />
        <StatCard
          title="Pending Receivables"
          value={formatCurrency(summary?.totalPendingFees || 0)}
          subtitle="Uncollected fees"
          icon={Clock}
          colorScheme="rose"
        />
        <StatCard
          title="Enrolled Learners"
          value={summary?.totalStudents || 0}
          subtitle="Active student body"
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Active Batches"
          value={summary?.totalBatches || 0}
          subtitle="Active study batches"
          icon={Layers}
          colorScheme="purple"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : activeTab === 'revenue' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl">
              <span className="text-xs text-slate-500">UPI / Digital Receipts</span>
              <p className="text-xl font-black text-slate-900 mt-1 tabular-nums">
                {formatCurrency(reportData?.modeBreakdown?.UPI?.total || 0)}
              </p>
              <span className="text-[11px] text-slate-400">{reportData?.modeBreakdown?.UPI?.count || 0} transactions</span>
            </div>
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl">
              <span className="text-xs text-slate-500">Cash Collections</span>
              <p className="text-xl font-black text-slate-900 mt-1 tabular-nums">
                {formatCurrency(reportData?.modeBreakdown?.CASH?.total || 0)}
              </p>
              <span className="text-[11px] text-slate-400">{reportData?.modeBreakdown?.CASH?.count || 0} transactions</span>
            </div>
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl">
              <span className="text-xs text-slate-500">Bank Transfer / NEFT</span>
              <p className="text-xl font-black text-slate-900 mt-1 tabular-nums">
                {formatCurrency(reportData?.modeBreakdown?.BANK_TRANSFER?.total || 0)}
              </p>
              <span className="text-[11px] text-slate-400">{reportData?.modeBreakdown?.BANK_TRANSFER?.count || 0} transactions</span>
            </div>
          </div>
        </div>
      ) : activeTab === 'pending' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Overdue Student Tuition Accounts
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Course & Batch</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Total Fee</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Outstanding Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData && reportData.length > 0 ? (
                  reportData.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {s.firstName} {s.lastName}
                        <span className="block text-[11px] font-normal text-slate-400 font-mono">{s.studentId}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.course?.name || '—'}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{s.phone}</td>
                      <td className="px-4 py-3 font-bold tabular-nums">{formatCurrency(s.totalFee)}</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold tabular-nums">{formatCurrency(s.paidFee)}</td>
                      <td className="px-4 py-3 text-rose-600 font-black tabular-nums">{formatCurrency(s.pendingFee)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Zero pending dues recorded across the institute.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'courses' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Academic Course Program Revenue Analysis
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3">Course Program</th>
                  <th className="px-4 py-3">Target Exam</th>
                  <th className="px-4 py-3">Fee / Student</th>
                  <th className="px-4 py-3">Enrolled</th>
                  <th className="px-4 py-3">Potential Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData && reportData.length > 0 ? (
                  reportData.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-bold text-slate-900">{c.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="primary" size="xs">{c.targetExam}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums">{formatCurrency(c.fee)}</td>
                      <td className="px-4 py-3 font-bold text-blue-600 tabular-nums">
                        {c._count?.students || 0}
                      </td>
                      <td className="px-4 py-3 font-black text-emerald-600 tabular-nums">
                        {formatCurrency((c._count?.students || 0) * (c.fee || 0))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No courses recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
