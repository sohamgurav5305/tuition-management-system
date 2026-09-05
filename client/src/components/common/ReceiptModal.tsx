import React, { useEffect, useState } from 'react';
import { Printer, CheckCircle2, Building2, Copy, Check, User, BookOpen, Layers } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { Payment } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { printReceipt, numberToWords } from '../../utils/printReceipt';
import { useToast } from '../../context/ToastContext';
import { paymentApi, studentApi } from '../../services/api';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, payment }) => {
  const { settings, formatCurrency, formatDate } = useSettings();
  const { success } = useToast();
  const [copied, setCopied] = useState(false);
  const [receiptData, setReceiptData] = useState<Payment | null>(payment);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    setReceiptData(payment);

    if (isOpen && payment) {
      // Check if student details or course are missing
      const isStudentIncomplete = !payment.student || !payment.student.firstName || !payment.student.course;

      if (isStudentIncomplete) {
        setLoadingDetails(true);

        const fetchFullDetails = async () => {
          try {
            // First attempt: fetch payment by ID
            if (payment.id) {
              const payRes = await paymentApi.getById(payment.id);
              if (payRes.data?.data) {
                setReceiptData(payRes.data.data);
                return;
              }
            }

            // Second attempt: fetch by receipt ID
            if (payment.receiptId) {
              const recRes = await paymentApi.getByReceiptId(payment.receiptId);
              if (recRes.data?.data) {
                setReceiptData(recRes.data.data);
                return;
              }
            }

            // Third attempt: fetch student directly if studentId is present
            if (payment.studentId) {
              const stuRes = await studentApi.getById(payment.studentId);
              if (stuRes.data?.data) {
                setReceiptData((prev) =>
                  prev ? { ...prev, student: stuRes.data.data } : prev
                );
              }
            }
          } catch (err) {
            console.warn('Could not enrich receipt details', err);
          } finally {
            setLoadingDetails(false);
          }
        };

        fetchFullDetails();
      }
    }
  }, [isOpen, payment]);

  if (!payment && !receiptData) return null;

  const currentPayment = receiptData || payment;
  if (!currentPayment) return null;

  const student = currentPayment.student;
  const amountWords = numberToWords(Number(currentPayment.amount));

  const handlePrint = () => {
    printReceipt({ payment: currentPayment, settings });
  };

  const handleCopyReceiptId = () => {
    navigator.clipboard.writeText(currentPayment.receiptId);
    setCopied(true);
    success('Copied', `Receipt ID ${currentPayment.receiptId} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const studentName = student?.firstName
    ? `${student.firstName} ${student.lastName || ''}`.trim()
    : 'Enrolled Student';

  const courseName = student?.course?.name || 'Academic Course Program';
  const targetExam = student?.course?.targetExam || 'Entrance / Foundation';
  const batchName = student?.batch?.name || 'Assigned Batch';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Tuition Fee Receipt" maxWidth="2xl">
      <div className="space-y-6">
        {/* Printable Receipt Preview Container */}
        <div
          id="printable-receipt"
          className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-6 select-text"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm flex-shrink-0">
                A
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                  {settings.instituteName}
                </h2>
                <p className="text-[11px] text-slate-500">{settings.address}</p>
                <p className="text-[10px] text-slate-400">
                  Tel: {settings.contactPhone} &bull; Email: {settings.contactEmail} &bull; Session {settings.academicYear || '2026-2027'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right flex-shrink-0">
              <Badge variant="success" size="xs" dot>
                Tax Invoice &bull; Paid
              </Badge>
              <div className="flex items-center gap-1 mt-1.5 sm:justify-end">
                <span className="text-xs font-mono font-bold text-blue-600">
                  {currentPayment.receiptId}
                </span>
                <button
                  onClick={handleCopyReceiptId}
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                  title="Copy Receipt No"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Date: {formatDate(currentPayment.paymentDate)}</p>
            </div>
          </div>

          {/* Student & Course Particulars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-blue-500" />
                Billed To (Student Particulars)
              </p>
              <p className="font-bold text-slate-900 text-sm">
                {studentName}
              </p>
              <p className="text-slate-600">
                Student ID: <span className="font-mono font-bold text-blue-600">{student?.studentId || currentPayment.studentId || '—'}</span>
              </p>
              <p className="text-slate-600">
                Guardian: <span className="font-semibold text-slate-800">{student?.guardianName || 'Guardian / Parent'}</span> {student?.guardianRelation ? `(${student.guardianRelation})` : ''}
              </p>
              <p className="text-slate-600">
                Phone: <span className="font-semibold">{student?.phone || student?.guardianPhone || '—'}</span>
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-purple-500" />
                Academic Program & Batch
              </p>
              <p className="font-bold text-slate-900 text-sm">
                {courseName}
              </p>
              <p className="text-slate-600">
                Target Stream: <span className="font-semibold text-slate-800">{targetExam}</span>
              </p>
              <p className="text-slate-600">
                Batch: <span className="font-semibold text-purple-600">{batchName}</span>
              </p>
            </div>
          </div>

          {/* Amount Paid Highlight Banner */}
          <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                Amount Received in Full ({currentPayment.paymentMode})
              </span>
              <p className="text-xs font-semibold text-blue-700 italic mt-0.5">
                {amountWords}
              </p>
              {currentPayment.transactionReference && (
                <p className="text-[10px] font-mono text-blue-600 mt-0.5">
                  Txn Ref: {currentPayment.transactionReference}
                </p>
              )}
            </div>
            <div className="text-2xl font-black text-blue-700 tabular-nums">
              {formatCurrency(currentPayment.amount)}
            </div>
          </div>

          {/* Ledger Summary */}
          {student && (
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-2.5 rounded-xl border border-slate-200/60 bg-slate-50/50">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Course Fee</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatCurrency(student.totalFee)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl border border-emerald-200/60 bg-emerald-50/40">
                <span className="text-[10px] text-emerald-600 block uppercase font-bold">Paid to Date</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(student.paidFee)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl border border-rose-200/60 bg-rose-50/40">
                <span className="text-[10px] text-rose-600 block uppercase font-bold">Balance Due</span>
                <span className="font-bold text-rose-700 tabular-nums">
                  {formatCurrency(student.pendingFee)}
                </span>
              </div>
            </div>
          )}

          {/* Footer Verification Stamp */}
          <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Electronically verified & signed by Accounts Desk</span>
            </div>
            <span className="text-[10px] text-slate-400">
              SAC Code: 999293 &bull; Coaching & Tuition Services
            </span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" leftIcon={Printer} onClick={handlePrint}>
            Print Official Receipt (A4)
          </Button>
        </div>
      </div>
    </Modal>
  );
};
