import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreditCard, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { paymentApi, studentApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { Student } from '../../types';

const paymentSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  amount: z.coerce.number().min(1, 'Payment amount must be greater than zero'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER']).default('UPI'),
  transactionReference: z.string().optional(),
  remarks: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData?: any) => void;
  student?: Student | null;
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  student: propStudent,
}) => {
  const { success, error } = useToast();
  const { formatCurrency } = useSettings();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(propStudent || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overpaymentError, setOverpaymentError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      studentId: propStudent?.id || '',
      amount: propStudent?.pendingFee || 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'UPI',
      transactionReference: '',
      remarks: 'Tuition installment',
    },
  });

  const studentIdWatch = watch('studentId');
  const amountWatch = watch('amount');

  useEffect(() => {
    if (isOpen) {
      setOverpaymentError(null);
      if (propStudent) {
        setSelectedStudent(propStudent);
        reset({
          studentId: propStudent.id,
          amount: propStudent.pendingFee,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMode: 'UPI',
          transactionReference: '',
          remarks: 'Tuition installment',
        });
      } else {
        const loadStudents = async () => {
          try {
            const res = await studentApi.getAll({ feeStatus: 'PENDING' });
            setStudents(res.data.data);
          } catch (err) {
            console.error('Failed to load students for payment', err);
          }
        };
        loadStudents();
      }
    }
  }, [isOpen, propStudent, reset]);

  useEffect(() => {
    if (!propStudent && studentIdWatch) {
      const found = students.find((s) => s.id === studentIdWatch);
      if (found) {
        setSelectedStudent(found);
        setValue('amount', found.pendingFee);
      }
    }
  }, [studentIdWatch, students, propStudent, setValue]);

  // Real-time overpayment alert
  useEffect(() => {
    if (selectedStudent && Number(amountWatch) > selectedStudent.pendingFee) {
      setOverpaymentError(
        `Overpayment warning: Entered amount (${formatCurrency(amountWatch)}) exceeds student's remaining pending balance (${formatCurrency(selectedStudent.pendingFee)}).`
      );
    } else {
      setOverpaymentError(null);
    }
  }, [amountWatch, selectedStudent, formatCurrency]);

  const onSubmit = async (values: PaymentFormValues) => {
    if (selectedStudent && values.amount > selectedStudent.pendingFee) {
      setOverpaymentError(`Payment cannot exceed pending fee balance (${formatCurrency(selectedStudent.pendingFee)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await paymentApi.recordPayment(values);
      success('Payment Recorded', `Official receipt generated.`);
      const paymentData = res.data.data?.payment || res.data.data;
      if (paymentData && res.data.data?.student) {
        paymentData.student = {
          ...paymentData.student,
          ...res.data.data.student,
          course: res.data.data.student.course || selectedStudent?.course,
          batch: res.data.data.student.batch || selectedStudent?.batch,
        };
      }
      onSuccess(paymentData);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Payment recording failed';
      setOverpaymentError(msg);
      error('Transaction Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Tuition Fee Payment"
      subtitle="Issue verified payment receipt and update student balance"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {overpaymentError && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Overpayment Validation</p>
              <p className="mt-0.5">{overpaymentError}</p>
            </div>
          </div>
        )}

        {/* Student Selector / Details */}
        {!propStudent ? (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Select Student *
            </label>
            <select
              {...register('studentId')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
            >
              <option value="">Choose Student with Pending Dues</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.studentId}) — Due: ${s.pendingFee}
                </option>
              ))}
            </select>
            {errors.studentId && <p className="text-xs text-rose-500 mt-1">{errors.studentId.message}</p>}
          </div>
        ) : null}

        {selectedStudent && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </p>
              <p className="text-slate-500 font-mono">{selectedStudent.studentId}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Pending Balance:</span>
              <p className="text-base font-black text-rose-600 dark:text-rose-400">
                {formatCurrency(selectedStudent.pendingFee)}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Amount to Collect ($) *
            </label>
            <input
              type="number"
              step="any"
              {...register('amount')}
              className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
            />
            {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Payment Mode *
            </label>
            <select
              {...register('paymentMode')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
            >
              <option value="UPI">UPI / Digital QR</option>
              <option value="CASH">Cash Deposit</option>
              <option value="BANK_TRANSFER">Bank Wire Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              {...register('paymentDate')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Transaction / Reference #
            </label>
            <input
              type="text"
              {...register('transactionReference')}
              placeholder="e.g. UPI-98437298 / CHQ-1049"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            Payment Remarks / Note
          </label>
          <input
            type="text"
            {...register('remarks')}
            placeholder="e.g. Second quarterly tuition installment"
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !!overpaymentError}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Issue Official Receipt'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
