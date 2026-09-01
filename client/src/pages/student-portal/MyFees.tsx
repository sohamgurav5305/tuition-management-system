import React, { useEffect, useState } from 'react';
import { CreditCard, DollarSign, Clock, CheckCircle2, Receipt, Sparkles, Calendar } from 'lucide-react';
import { paymentApi } from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Badge } from '../../components/common/Badge';
import { useSettings } from '../../context/SettingsContext';
import { Payment, FeeInstallment } from '../../types';
import { ReceiptModal } from '../../components/common/ReceiptModal';

export const MyFees: React.FC = () => {
  const { formatCurrency } = useSettings();
  const [feeData, setFeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const res = await paymentApi.getMyFees();
        setFeeData(res.data.data);
      } catch (err) {
        console.error('Failed to load my fees', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
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
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          My Tuition Fees & Installment Schedules
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review your enrolled program fee balance, term installment schedules, scholarship concession, and official GST tax receipts.
        </p>
      </div>

      {/* Fee Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Agreed Total Fee</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(totalFee)}
          </p>
        </div>
        <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-3xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-sm">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Total Paid</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {formatCurrency(paidFee)}
          </p>
        </div>
        <div className="p-6 bg-rose-50/50 dark:bg-rose-950/30 rounded-3xl border border-rose-200/60 dark:border-rose-900/40 shadow-sm">
          <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider">Remaining Balance</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-300 mt-1">
            {formatCurrency(pendingFee)}
          </p>
        </div>
      </div>

      {/* Term-wise Installment Schedule */}
      {installments.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Term Fee Installment Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {installments.map((inst) => (
              <div
                key={inst.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{inst.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                      inst.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : inst.status === 'OVERDUE'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {inst.status}
                  </span>
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {formatCurrency(inst.amount)}
                </p>
                <p className="text-slate-400 text-[11px]">Due Date: {inst.dueDate}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions & Receipts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
          Payment Receipts Ledger
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Receipt Number</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">GST Tax Component</th>
                <th className="px-4 py-3">Net Paid</th>
                <th className="px-4 py-3 text-right">Official Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {p.receiptId}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{p.paymentDate}</td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral" size="sm">{p.paymentMode}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatCurrency(p.taxAmount || 0)} (18% GST)
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedReceipt({ ...p, student: feeData?.student })}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white rounded-xl font-bold transition-all inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3 h-3" /> View / Print
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
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
