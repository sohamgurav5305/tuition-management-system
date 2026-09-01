import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle2,
  PlusCircle,
  Download,
  Receipt,
  Filter,
  FileText,
  AlertTriangle,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { paymentApi, studentApi, reportApi, batchApi } from '../../services/api';
import { Student, Payment, Batch } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useSettings } from '../../context/SettingsContext';
import { CollectPaymentModal } from './CollectPaymentModal';
import { ReceiptModal } from '../../components/common/ReceiptModal';

export const FeeDashboard: React.FC = () => {
  const { formatCurrency } = useSettings();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'receipts'>('students');

  // Filters
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const [loading, setLoading] = useState(true);

  // Modals
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, stuRes, payRes, batRes] = await Promise.all([
        reportApi.getDashboardSummary(),
        studentApi.getAll({
          batchId: selectedBatch || undefined,
          feeStatus: selectedStatus || undefined,
        }),
        paymentApi.getAll({}),
        batchApi.getAll({ status: 'ACTIVE' }),
      ]);
      setSummary(sumRes.data.data);
      setStudents(stuRes.data.data);
      setPayments(payRes.data.data);
      setBatches(batRes.data.data);
    } catch (err) {
      console.error('Failed to load fees data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBatch, selectedStatus]);

  const handleOpenCollect = (student?: Student) => {
    setSelectedStudentForPay(student || null);
    setIsCollectOpen(true);
  };

  const handlePaymentRecorded = (newPayment: any) => {
    loadData();
    if (newPayment) {
      setSelectedReceipt(newPayment);
    }
  };

  const totalCollected = summary?.totalRevenue || 0;
  const pendingFees = summary?.pendingFees || 0;
  const studentsWithDues = students.filter((s) => s.pendingFee > 0).length;
  const overdueAmount = Math.round(pendingFees * 0.35); // Estimated overdue component

  const grandTotal = (totalCollected + pendingFees) || 1;
  const collectionPercent = Math.min(100, Math.round((totalCollected / grandTotal) * 100));

  const studentColumns: Column<Student>[] = [
    {
      header: 'Student',
      cell: (s) => (
        <div>
          <span
            onClick={() => navigate(`/students/${s.id}`)}
            className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer block text-xs sm:text-sm truncate"
          >
            {s.firstName} {s.lastName}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">{s.studentId}</span>
        </div>
      ),
    },
    {
      header: 'Batch',
      cell: (s) => (
        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/60">
          {s.batch?.name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Total Agreed Fee',
      cell: (s) => (
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
          {formatCurrency(s.totalFee)}
        </span>
      ),
    },
    {
      header: 'Paid Amount',
      cell: (s) => (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          {formatCurrency(s.paidFee)}
        </span>
      ),
    },
    {
      header: 'Pending Balance',
      cell: (s) => (
        <span
          className={`text-xs font-black tabular-nums ${
            s.pendingFee > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
          }`}
        >
          {formatCurrency(s.pendingFee)}
        </span>
      ),
    },
    {
      header: 'Due Date',
      cell: (s) => (
        <span className="text-xs text-slate-500 font-mono">
          {s.installments?.[0]?.dueDate || 'End of Term'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (s) => {
        const isPaid = s.pendingFee === 0 && s.paidFee > 0;
        const isPartial = s.paidFee > 0 && s.pendingFee > 0;
        return (
          <Badge variant={isPaid ? 'success' : isPartial ? 'warning' : 'danger'} size="xs" dot>
            {isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'PENDING'}
          </Badge>
        );
      },
    },
    {
      header: 'Action',
      cell: (s) => (
        <div className="flex items-center gap-1.5">
          {s.pendingFee > 0 && (
            <Button
              variant="primary"
              size="xs"
              leftIcon={DollarSign}
              onClick={() => handleOpenCollect(s)}
            >
              Collect
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => navigate(`/students/${s.id}`)}
          >
            Ledger
          </Button>
        </div>
      ),
    },
  ];

  const receiptColumns: Column<Payment>[] = [
    {
      header: 'Receipt No',
      cell: (p) => (
        <span
          onClick={() => setSelectedReceipt(p)}
          className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          {p.receiptId}
        </span>
      ),
    },
    {
      header: 'Student Name',
      cell: (p) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
            {p.student ? `${p.student.firstName} ${p.student.lastName}` : 'Enrolled Student'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{p.student?.studentId}</span>
        </div>
      ),
    },
    {
      header: 'Amount Received',
      cell: (p) => (
        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
          {formatCurrency(p.amount)}
        </span>
      ),
    },
    {
      header: 'Mode',
      cell: (p) => <Badge variant="neutral" size="xs">{p.paymentMode}</Badge>,
    },
    {
      header: 'Txn Reference',
      cell: (p) => (
        <span className="text-[11px] font-mono text-slate-500">
          {p.transactionReference || '—'}
        </span>
      ),
    },
    {
      header: 'Date',
      cell: (p) => <span className="text-xs text-slate-500 font-mono">{p.paymentDate}</span>,
    },
    {
      header: 'Receipt',
      cell: (p) => (
        <Button
          variant="secondary"
          size="xs"
          leftIcon={Receipt}
          onClick={() => setSelectedReceipt(p)}
        >
          View / Print
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <PageHeader
        title="Fee Ledger & Invoices"
        subtitle="Manage student fee installments, collection receipts, pending balance recovery, and official tax invoices."
        badge={`${studentsWithDues} Students with Dues`}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={PlusCircle}
            onClick={() => handleOpenCollect()}
          >
            Collect Fee Payment
          </Button>
        }
      />

      {/* Top 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Collection"
          value={formatCurrency(totalCollected)}
          subtitle={`${collectionPercent}% of total agreed fees`}
          icon={DollarSign}
          colorScheme="emerald"
        />
        <StatCard
          title="Pending Fees"
          value={formatCurrency(pendingFees)}
          subtitle="Remaining installment dues"
          icon={Clock}
          colorScheme="amber"
        />
        <StatCard
          title="Estimated Overdue"
          value={formatCurrency(overdueAmount)}
          subtitle="Crossed term due dates"
          icon={AlertTriangle}
          colorScheme="rose"
        />
        <StatCard
          title="Students With Dues"
          value={studentsWithDues}
          subtitle="Learners with balance > ₹0"
          icon={UserCheck}
          colorScheme="blue"
        />
      </div>

      {/* Simple Fee Collection Visualization Banner */}
      <div className="p-4 sm:p-5 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-900 dark:text-slate-100">
              Institutional Fee Realization Progress
            </span>
          </div>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {collectionPercent}% Collected
          </span>
        </div>

        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
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

      {/* Segmented Tabs (Student Fee Accounts Ledger vs Official Receipts Audit) */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'students'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Student Accounts Ledger ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'receipts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Payment Receipts Audit ({payments.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Student Fee Accounts Ledger */}
      {activeTab === 'students' && (
        <DataTable
          columns={studentColumns}
          data={students}
          keyExtractor={(s: Student) => s.id}
          isLoading={loading}
          searchPlaceholder="Search student by name or ID..."
          searchableFields={['firstName', 'lastName', 'studentId']}
          filters={
            <div className="flex items-center gap-2">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="">All Fee Statuses</option>
                <option value="PAID">Paid in Full</option>
                <option value="PARTIAL">Partial Dues</option>
                <option value="PENDING">Pending Dues</option>
              </select>
            </div>
          }
          emptyTitle="No Student Fee Records"
          emptySubtitle="No student fee accounts matched the current filters."
        />
      )}

      {/* Tab 2: Payment Receipts Audit Table */}
      {activeTab === 'receipts' && (
        <DataTable
          columns={receiptColumns}
          data={payments}
          keyExtractor={(p: Payment) => p.id}
          isLoading={loading}
          searchPlaceholder="Search receipt number or transaction ref..."
          searchableFields={['receiptId', 'transactionReference']}
          emptyTitle="No Payment Receipts"
          emptySubtitle="No official payment receipts have been generated yet."
        />
      )}

      {/* Payment Collection Modal */}
      <CollectPaymentModal
        isOpen={isCollectOpen}
        onClose={() => {
          setIsCollectOpen(false);
          setSelectedStudentForPay(null);
        }}
        onSuccess={handlePaymentRecorded}
        student={selectedStudentForPay}
      />

      {/* Official A4 Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
      />
    </div>
  );
};
