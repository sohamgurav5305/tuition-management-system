import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  PlusCircle,
  Filter,
} from 'lucide-react';
import { paymentApi } from '../../services/api';
import { Payment } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { useSettings } from '../../context/SettingsContext';
import { CollectPaymentModal } from './CollectPaymentModal';
import { AssignFeeModal } from './AssignFeeModal';

export const ReceiptsAuditPage: React.FC = () => {
  const { formatCurrency, formatDate } = useSettings();
  const navigate = useNavigate();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState<string>('');

  // Modals
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  const fetchPayments = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await paymentApi.getAll({
        paymentMode: selectedMode || undefined,
      });
      setPayments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load receipts', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(true);
    const interval = setInterval(() => {
      fetchPayments(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedMode]);

  const handlePaymentRecorded = (newPayment: any) => {
    fetchPayments();
    if (newPayment) {
      navigate('/receipts/' + (newPayment.id || newPayment.receiptId));
    }
  };

  const columns: Column<Payment>[] = [
    {
      header: 'Receipt No',
      cell: (p) => (
        <span
          onClick={() => navigate(`/receipts/${p.id || p.receiptId}`)}
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
          <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
            {p.student ? `${p.student.firstName} ${p.student.lastName}` : 'Enrolled Student'}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{p.student?.studentId}</span>
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
      header: 'Payment Mode',
      cell: (p) => (
        <Badge
          variant={p.paymentMode === 'UPI' ? 'primary' : p.paymentMode === 'CASH' ? 'success' : 'neutral'}
          size="xs"
        >
          {p.paymentMode}
        </Badge>
      ),
    },
    {
      header: 'Txn Reference',
      cell: (p) => (
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          {p.transactionReference || '—'}
        </span>
      ),
    },
    {
      header: 'Date',
      cell: (p) => <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{formatDate(p.paymentDate)}</span>,
    },
    {
      header: 'Receipt',
      cell: (p) => (
        <Button
          variant="secondary"
          size="xs"
          leftIcon={Receipt}
          onClick={() => navigate(`/receipts/${p.id || p.receiptId}`)}
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
        title="Payment Receipts"
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
              leftIcon={PlusCircle}
              onClick={() => setIsCollectOpen(true)}
            >
              Collect Fee Payment
            </Button>
          </div>
        }
      />

      {/* Payment Receipts DataTable */}
      <DataTable
        columns={columns}
        data={payments}
        keyExtractor={(p: Payment) => p.id}
        isLoading={loading}
        searchPlaceholder="Search receipt number, transaction ref, student name, or mode..."
        searchableFields={['receiptId', 'transactionReference', 'student', 'paymentMode', 'remarks']}
        filters={
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Payment Mode:
            </span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">All Payment Modes</option>
              <option value="UPI">UPI / Digital</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Debit / Credit Card</option>
              <option value="NET_BANKING">Net Banking</option>
              <option value="CHEQUE">Cheque / DD</option>
            </select>
          </div>
        }
        emptyTitle="No Payment Receipts Found"
        emptySubtitle="No official payment receipts match your active filter and search criteria."
      />

      {/* Payment Collection Modal */}
      <CollectPaymentModal
        isOpen={isCollectOpen}
        onClose={() => setIsCollectOpen(false)}
        onSuccess={handlePaymentRecorded}
      />

      {/* Assign Fee Modal */}
      <AssignFeeModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSuccess={fetchPayments}
      />
    </div>
  );
};
