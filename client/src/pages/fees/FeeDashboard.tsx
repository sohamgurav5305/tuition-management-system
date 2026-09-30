import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  PlusCircle,
  Filter,
} from 'lucide-react';
import { studentApi, reportApi, batchApi } from '../../services/api';
import { Student, Payment, Batch } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { useSettings } from '../../context/SettingsContext';
import { CollectPaymentModal } from './CollectPaymentModal';
import { AssignFeeModal } from './AssignFeeModal';

export const FeeDashboard: React.FC = () => {
  const { formatCurrency, formatDate } = useSettings();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Filters
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const [loading, setLoading] = useState(true);

  // Modals
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);

  const loadData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const [sumRes, stuRes, batRes] = await Promise.all([
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
        batchApi.getAll({ status: 'ACTIVE' }).catch((err) => {
          console.error('Failed batches fetch', err);
          return { data: { data: [] } };
        }),
      ]);
      if (sumRes.data?.data) setSummary(sumRes.data.data);
      if (stuRes.data?.data) setStudents(stuRes.data.data);
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
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedBatch, selectedStatus]);

  const handleOpenCollect = (student?: Student) => {
    setSelectedStudentForPay(student || null);
    setIsCollectOpen(true);
  };

  const handlePaymentRecorded = (newPayment: any) => {
    loadData();
    if (newPayment) {
      navigate('/receipts/' + (newPayment.id || newPayment.receiptId));
    }
  };

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
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{s.studentId}</span>
        </div>
      ),
    },
    {
      header: 'Batch',
      cell: (s) => (
        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-900">
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
            s.pendingFee > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {formatCurrency(s.pendingFee)}
        </span>
      ),
    },
    {
      header: 'Due Date',
      cell: (s) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
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
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <PageHeader
        title="Fee Ledger & Invoices"
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

      {/* Main Student Fee Accounts Ledger */}
      <DataTable
        columns={studentColumns}
        data={students}
        keyExtractor={(s: Student) => s.id}
        isLoading={loading}
        searchPlaceholder="Search student by name, roll, batch, or student ID..."
        searchableFields={['firstName', 'lastName', 'studentId', 'rollNumber', 'phone', 'batch', 'course']}
        filters={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Batch:
              </span>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Fee Status:
              </span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="">All Fee Statuses</option>
                <option value="PAID">Paid in Full</option>
                <option value="PARTIAL">Partial Dues</option>
                <option value="PENDING">Pending Dues</option>
              </select>
            </div>
          </div>
        }
        emptyTitle="No Student Fee Records"
        emptySubtitle="No student fee accounts matched the current filters."
      />

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
    </div>
  );
};

export default FeeDashboard;
