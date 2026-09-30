import React, { useEffect, useState } from 'react';
import { CreditCard, DollarSign, Clock, CheckCircle2, Receipt, Sparkles, Calendar } from 'lucide-react';
import { paymentApi } from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Badge } from '../../components/common/Badge';
import { useSettings } from '../../context/SettingsContext';
import { Payment, FeeInstallment } from '../../types';
import { ReceiptModal } from '../../components/common/ReceiptModal';

export const MyFees: React.FC = () => {
  const { formatCurrency, formatDate } = useSettings();
  const [feeData, setFeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const fetchFees = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await paymentApi.getMyFees();
      setFeeData(res.data.data);
    } catch (err) {
      console.error('Failed to load my fees', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees(true);
    const interval = setInterval(() => {
      fetchFees(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSkeleton count={4} />;

  const totalFee = feeData?.totalFee || 0;
  const paidFee = feeData?.paidFee || 0;
  const pendingFee = feeData?.pendingFee || 0;
  const installments: FeeInstallment[] = feeData?.installments || [];
  const payments: Payment[] = feeData?.payments || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Fees & Receipts
        </h1>
      </div>

      {/* Fee Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Agreed Total Fee</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(totalFee)}
          </p>
        </div>
        <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-3xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Total Paid</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
            {formatCurrency(paidFee)}
          </p>
        </div>
        <div className="p-6 bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl border border-rose-200/60 dark:border-rose-800/40 shadow-sm">
          <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider">Remaining Balance</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-400 mt-1">
            {formatCurrency(pendingFee)}
          </p>
        </div>
      </div>

      {/* Term-wise Installment Schedule in Row Format */}
      {installments.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Term Fee Installment Breakdown
            </h3>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {installments.length} {installments.length === 1 ? 'Installment' : 'Installments'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Fee Head / Installment</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {installments.map((inst, index) => (
                  <tr key={inst.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-400 dark:text-slate-500 font-mono">
                      {inst.installmentNo ? `#${inst.installmentNo}` : `#${index + 1}`}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {inst.title}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {formatDate(inst.dueDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(inst.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Badge
                        variant={
                          inst.status === 'PAID'
                            ? 'success'
                            : inst.status === 'OVERDUE'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                        dot
                      >
                        {inst.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions & Receipts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
          Payment Receipts
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Receipt Number</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-right">Official Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {p.receiptId}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral" size="sm">{p.paymentMode}</Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedReceipt({ ...p, student: feeData?.student })}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white rounded-xl font-bold transition-all inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" /> View / Print
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    No payment transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
      />
    </div>
  );
};
