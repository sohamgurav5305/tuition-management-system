import React, { useEffect, useState } from 'react';
import {
  Receipt,
  PlusCircle,
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
import { ReceiptModal } from '../../components/common/ReceiptModal';

export const ReceiptsAuditPage: React.FC = () => {
  const { formatCurrency, formatDate } = useSettings();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState<string>('');

  // Modals
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

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
      setSelectedReceipt(newPayment);
    }
  };

  const columns: Column<Payment>[] = [
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
        title="Payment Receipts"
        subtitle=""
        badge={`${payments.length} Receipts Processed`}
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
          <div className="flex items-center gap-2">
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
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

      {/* Official Printable Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          payment={selectedReceipt}
        />
      )}
    </div>
  );
};
