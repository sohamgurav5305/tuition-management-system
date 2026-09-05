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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Fees & Receipts
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          
        </p>
      </div>

      {/* Fee Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Agreed Total Fee</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {formatCurrency(totalFee)}
          </p>
        </div>
        <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-200/60 shadow-sm">
          <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Total Paid</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
            {formatCurrency(paidFee)}
          </p>
        </div>
        <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-200/60 shadow-sm">
          <span className="text-xs text-rose-600 font-semibold uppercase tracking-wider">Remaining Balance</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">
            {formatCurrency(pendingFee)}
          </p>
        </div>
      </div>

      {/* Term-wise Installment Schedule */}
      {installments.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Term Fee Installment Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {installments.map((inst) => (
              <div
                key={inst.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{inst.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                      inst.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inst.status === 'OVERDUE'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {inst.status}
                  </span>
                </div>
                <p className="text-lg font-black text-slate-900">
                  {formatCurrency(inst.amount)}
                </p>
                <p className="text-slate-400 text-[11px]">Due Date: {formatDate(inst.dueDate)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions & Receipts Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm overflow-hidden">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          Payment Receipts Ledger
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200/60">
              <tr>
                <th className="px-4 py-3">Receipt Number</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-right">Official Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      {p.receiptId}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral" size="sm">{p.paymentMode}</Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedReceipt({ ...p, student: feeData?.student })}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl font-bold transition-all inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3 h-3" /> View / Print
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
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
