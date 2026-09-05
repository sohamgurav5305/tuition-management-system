import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  PlusCircle,
  Receipt,
  Filter,
  FileText,
} from 'lucide-react';
import { paymentApi, studentApi, reportApi, batchApi } from '../../services/api';
import { Student, Payment, Batch } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useSettings } from '../../context/SettingsContext';
import { CollectPaymentModal } from './CollectPaymentModal';
import { AssignFeeModal } from './AssignFeeModal';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { FeeRecordsSection } from './FeeRecordsSection';

export const FeeDashboard: React.FC = () => {
  const { formatCurrency, formatDate } = useSettings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'students' | 'records' | 'receipts'>(
    tabFromUrl === 'records' || tabFromUrl === 'receipts' ? tabFromUrl : 'students'
  );

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'records' || t === 'receipts' || t === 'students') {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'students' | 'records' | 'receipts') => {
    setActiveTab(tab);
    setSearchParams(tab === 'students' ? {} : { tab });
  };

  // Filters
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const [loading, setLoading] = useState(true);

  // Modals
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const loadData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const [sumRes, stuRes, payRes, batRes] = await Promise.all([
        reportApi.getDashboardSummary().catch((err) => {
          console.error('Failed summary fetch', err);
          return { data: { data: null } };
        }),
        studentApi.getAll({
          batchId: selectedBatch || undefined,
          feeStatus: selectedStatus || undefined,
        }).catch((err) => {
          console.error('Failed students fetch', err);
          return { data: { data: [] } };
        }),
        paymentApi.getAll({}).catch((err) => {
          console.error('Failed payments fetch', err);
          return { data: { data: [] } };
        }),
        batchApi.getAll({ status: 'ACTIVE' }).catch((err) => {
          console.error('Failed batches fetch', err);
          return { data: { data: [] } };
        }),
      ]);
      if (sumRes.data?.data) setSummary(sumRes.data.data);
      if (stuRes.data?.data) setStudents(stuRes.data.data);
      if (payRes.data?.data) setPayments(payRes.data.data);
      if (batRes.data?.data) setBatches(batRes.data.data);
    } catch (err) {
      console.error('Failed to load fees data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 5000);
    return () => clearInterval(interval);
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

  const studentsWithDues = students.filter((s) => s.pendingFee > 0).length;

  const studentColumns: Column<Student>[] = [

    {
      header: 'Student',
      cell: (s) => (
        <div>
          <span
            onClick={() => navigate(`/students/${s.id}`)}
            className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer block text-xs sm:text-sm truncate"
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
        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
          {s.batch?.name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Total Agreed Fee',
      cell: (s) => (
        <span className="text-xs font-bold text-slate-900 tabular-nums">
          {formatCurrency(s.totalFee)}
        </span>
      ),
    },
    {
      header: 'Paid Amount',
      cell: (s) => (
        <span className="text-xs font-bold text-emerald-600 tabular-nums">
          {formatCurrency(s.paidFee)}
        </span>
      ),
    },
    {
      header: 'Pending Balance',
      cell: (s) => (
        <span
          className={`text-xs font-black tabular-nums ${
            s.pendingFee > 0 ? 'text-rose-600' : 'text-slate-400'
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
          {s.installments?.[0]?.dueDate ? formatDate(s.installments[0].dueDate) : 'End of Term'}
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
              onClick={() => handleOpenCollect(s)}
            >
              Collect
            </Button>
          )}
          <Button
            variant="outline"
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
          className="text-xs font-mono font-bold text-blue-600 hover:underline cursor-pointer"
        >
          {p.receiptId}
        </span>
      ),
    },
    {
      header: 'Student Name',
      cell: (p) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">
            {p.student ? `${p.student.firstName} ${p.student.lastName}` : 'Enrolled Student'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{p.student?.studentId}</span>
        </div>
      ),
    },
    {
      header: 'Amount Received',
      cell: (p) => (
        <span className="text-xs font-black text-emerald-600 tabular-nums">
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
      cell: (p) => <span className="text-xs text-slate-500 font-mono">{formatDate(p.paymentDate)}</span>,
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
        subtitle=""
        badge={`${studentsWithDues} Students with Dues`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => setIsAssignOpen(true)}
            >
              Assign Fee
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={CreditCard}
              onClick={() => handleOpenCollect()}
            >
              Collect Fee Payment
            </Button>
          </div>
        }
      />

      {/* Segmented Tabs (Student Fee Accounts Ledger vs Fee Records vs Official Receipts Audit) */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange('students')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'students'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Student Accounts Ledger ({students.length})
          </button>
          <button
            onClick={() => handleTabChange('records')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'records'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Fee Records & Print Register
          </button>
          <button
            onClick={() => handleTabChange('receipts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'receipts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Payment Receipts ({payments.length})
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
          searchPlaceholder="Search student by name, roll, batch, or student ID..."
          searchableFields={['firstName', 'lastName', 'studentId', 'rollNumber', 'phone', 'batch', 'course']}
          filters={
            <div className="flex items-center gap-2">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
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
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
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

      {/* Tab 2: Fee Records & Print Register */}
      {activeTab === 'records' && (
        <FeeRecordsSection
          students={students}
          batches={batches}
          loading={loading}
          onOpenCollect={handleOpenCollect}
        />
      )}

      {/* Tab 3: Payment Receipts Table */}
      {activeTab === 'receipts' && (
        <DataTable
          columns={receiptColumns}
          data={payments}
          keyExtractor={(p: Payment) => p.id}
          isLoading={loading}
          searchPlaceholder="Search receipt number, transaction ref, student name, or mode..."
          searchableFields={['receiptId', 'transactionReference', 'student', 'paymentMode', 'remarks']}
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

      {/* Assign Fee Modal */}
      <AssignFeeModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSuccess={loadData}
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
