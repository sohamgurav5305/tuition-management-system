import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Copy,
  Check,
  User,
  BookOpen,
  Receipt,
  Clock,
  Building2,
} from 'lucide-react';
import { paymentApi, studentApi } from '../../services/api';
import { Payment } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { printReceipt, numberToWords } from '../../utils/printReceipt';

export const ReceiptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings, formatCurrency, formatDate } = useSettings();
  const { success, error: toastError } = useToast();
  const { user } = useAuth();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchReceipt = async () => {
      setLoading(true);
      try {
        let paymentData: Payment | null = null;

        // 1. Try by database ID
        try {
          const res = await paymentApi.getById(id);
          if (res.data?.data) {
            paymentData = res.data.data;
          }
        } catch {}

        // 2. Try by receiptId code (e.g. REC-2026-00010)
        if (!paymentData) {
          try {
            const res = await paymentApi.getByReceiptId(id);
            if (res.data?.data) {
              paymentData = res.data.data;
            }
          } catch {}
        }

        // 3. If student is incomplete, enrich student record
        if (paymentData && (!paymentData.student || !paymentData.student.firstName)) {
          if (paymentData.studentId) {
            try {
              const stuRes = await studentApi.getById(paymentData.studentId);
              if (stuRes.data?.data) {
                paymentData.student = stuRes.data.data;
              }
            } catch {}
          }
        }

        if (paymentData) {
          setPayment(paymentData);
        } else {
          toastError('Receipt Not Found', 'Could not locate the requested payment receipt');
        }
      } catch (err: any) {
        console.error('Failed to load receipt', err);
        toastError('Failed to Load', err.message || 'Could not load receipt');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [id]);

  const handlePrint = () => {
    if (!payment) return;
    printReceipt({ payment, settings });
  };

  const handleCopyReceiptId = () => {
    if (!payment?.receiptId) return;
    navigator.clipboard.writeText(payment.receiptId);
    setCopied(true);
    success('Copied', `Receipt ID ${payment.receiptId} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (user?.role === 'STUDENT') {
      navigate('/student/fees');
    } else {
      navigate('/receipts');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="max-w-2xl mx-auto my-12 text-center space-y-4 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <Receipt className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Receipt Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested payment receipt could not be found or has been removed.
        </p>
        <Button variant="secondary" size="sm" onClick={handleBack} leftIcon={ArrowLeft}>
          Go Back
        </Button>
      </div>
    );
  }

  const student = payment.student;
  const amountWords = numberToWords(Number(payment.amount));
  const studentName = student?.firstName
    ? `${student.firstName} ${student.lastName || ''}`.trim()
    : 'Enrolled Student';
  const courseName = student?.course?.name || 'Academic Course Program';
  const targetExam = student?.course?.targetExam || 'Entrance / Foundation';
  const batchName = student?.batch?.name || 'Assigned Batch';

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={handleBack}
          className="self-start text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          Back
        </Button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            leftIcon={copied ? Check : Copy}
            onClick={handleCopyReceiptId}
          >
            {copied ? 'Copied ID' : 'Copy Receipt ID'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={Printer}
            onClick={handlePrint}
          >
            Print Official Receipt (A4)
          </Button>
        </div>
      </div>

      {/* Main Official Receipt Document Container */}
      <div
        id="printable-receipt"
        className="p-6 sm:p-10 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm space-y-6 select-text"
      >
        {/* Receipt Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-sm flex-shrink-0">
              {settings.instituteName ? settings.instituteName[0] : 'A'}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                {settings.instituteName}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{settings.address}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Tel: {settings.contactPhone} &bull; Email: {settings.contactEmail} &bull; Session {settings.academicYear || '2026-2027'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right flex-shrink-0">
            <Badge variant="success" size="sm" dot>
              Tax Invoice &bull; Paid
            </Badge>
            <div className="flex items-center gap-1 mt-2 sm:justify-end">
              <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                {payment.receiptId}
              </span>
              <button
                onClick={handleCopyReceiptId}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Copy Receipt No"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
              Date: {formatDate(payment.paymentDate)}
            </p>
          </div>
        </div>

        {/* Student & Academic Particulars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              Billed To (Student Particulars)
            </p>
            <p className="font-black text-slate-900 dark:text-slate-100 text-sm">
              {studentName}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Student ID: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{student?.studentId || payment.studentId || '—'}</span>
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Guardian: <span className="font-semibold text-slate-800 dark:text-slate-200">{student?.guardianName || 'Guardian / Parent'}</span> {student?.guardianRelation ? `(${student.guardianRelation})` : ''}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Phone: <span className="font-semibold">{student?.phone || student?.guardianPhone || '—'}</span>
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-500" />
              Academic Program & Batch
            </p>
            <p className="font-black text-slate-900 dark:text-slate-100 text-sm">
              {courseName}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Target Stream: <span className="font-semibold text-slate-800 dark:text-slate-200">{targetExam}</span>
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Batch: <span className="font-semibold text-purple-600 dark:text-purple-400">{batchName}</span>
            </p>
          </div>
        </div>

        {/* Amount Paid Highlight Banner */}
        <div className="p-5 bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/90 dark:border-blue-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200 block">
              Amount Received in Full ({payment.paymentMode})
            </span>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 italic mt-1">
              {amountWords}
            </p>
            {payment.transactionReference && (
              <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-1">
                Transaction Ref / UTR: {payment.transactionReference}
              </p>
            )}
            {payment.remarks && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Notes: {payment.remarks}
              </p>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300 tabular-nums">
            {formatCurrency(payment.amount)}
          </div>
        </div>

        {/* Ledger Summary */}
        {student && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Total Course Fee</span>
              <span className="text-base font-black text-slate-900 dark:text-slate-100 tabular-nums mt-0.5 block">
                {formatCurrency(student.totalFee)}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/40">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-bold">Paid to Date</span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5 block">
                {formatCurrency(student.paidFee)}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl border border-rose-200/70 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/40">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 block uppercase font-bold">Balance Due</span>
              <span className="text-base font-black text-rose-700 dark:text-rose-300 tabular-nums mt-0.5 block">
                {formatCurrency(student.pendingFee)}
              </span>
            </div>
          </div>
        )}

        {/* Footer Verification Stamp */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Electronically verified & signed by Accounts Desk</span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            SAC Code: 999293 &bull; Coaching & Tuition Services
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetailPage;
