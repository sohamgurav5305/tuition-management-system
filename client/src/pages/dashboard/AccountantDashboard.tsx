import React, { useEffect, useState } from 'react';
import { DollarSign, Clock, CreditCard, ArrowRight, Download, Receipt, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/common/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { reportApi, paymentApi } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { Payment } from '../../types';
import { ReceiptModal } from '../../components/common/ReceiptModal';

export const AccountantDashboard: React.FC = () => {
  const { formatCurrency } = useSettings();
  const [revenueData, setRevenueData] = useState<any>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccountantData = async () => {
      try {
        const [revRes, payRes] = await Promise.all([
          reportApi.getRevenueReport(),
          paymentApi.getAll({}),
        ]);
        setRevenueData(revRes.data.data);
        setRecentPayments(payRes.data.data.slice(0, 8));
      } catch (err) {
        console.error('Accountant dashboard error', err);
      } finally {
        setLoading(false);
      }
    };

    loadAccountantData();
  }, []);

  if (loading) return <LoadingSkeleton count={6} />;

  const modeBreakdown = revenueData?.modeBreakdown || {};

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <PageHeader
        title="Finance & Accounts Desk"
        subtitle="Tuition fee collections, receipt verification, GST ledger audits, and payment transaction logs."
        badge="Accounts Officer"
        actions={
          <>
            <Link to="/fees">
              <Button variant="primary" size="sm" leftIcon={CreditCard}>
                Collect Payment
              </Button>
            </Link>
            <a href={reportApi.exportCsvUrl('revenue')} download>
              <Button variant="secondary" size="sm" leftIcon={Download}>
                Export CSV
              </Button>
            </a>
          </>
        }
      />

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Collections"
          value={formatCurrency(revenueData?.totalRevenue || 0)}
          subtitle="Net revenue deposited"
          icon={DollarSign}
          colorScheme="emerald"
        />
        <StatCard
          title="Total Receipts"
          value={revenueData?.totalTransactions || 0}
          subtitle="Processed fee receipts"
          icon={Receipt}
          colorScheme="blue"
        />
        <StatCard
          title="UPI / Digital"
          value={formatCurrency(modeBreakdown.UPI?.total || 0)}
          subtitle={`${modeBreakdown.UPI?.count || 0} transactions`}
          icon={CreditCard}
          colorScheme="indigo"
        />
        <StatCard
          title="Cash & Direct Bank"
          value={formatCurrency((modeBreakdown.CASH?.total || 0) + (modeBreakdown.BANK_TRANSFER?.total || 0))}
          subtitle="Desk counter collections"
          icon={Clock}
          colorScheme="purple"
        />
      </div>

      {/* Recent Transactions Feed */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Recent Fee Collection Receipts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest payment entries verified across institute counters
            </p>
          </div>
          <Link
            to="/fees"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            All Invoices <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Receipt ID</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {p.receiptId}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {p.student?.firstName} {p.student?.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral" size="xs">{p.paymentMode}</Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {p.paymentDate}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              No Receipts Recorded Yet (Day 1 Session)
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Use the "+ Collect Payment" action button above to record the first student fee deposit.
            </p>
          </div>
        )}
      </div>

      {/* Invoice Receipt Modal */}
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
