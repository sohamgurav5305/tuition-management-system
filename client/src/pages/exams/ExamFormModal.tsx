import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/common/Modal';
import { examApi, batchApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Batch, Examination } from '../../types';

const examSchema = z
  .object({
    title: z.string().min(1, 'Exam title is required'),
    examPattern: z.enum(['JEE_MAIN', 'JEE_ADVANCED', 'NEET_UG', 'BOARD_TERM', 'OLYMPIAD']).default('JEE_MAIN'),
    examDate: z.string().min(1, 'Exam date is required'),
    batchId: z.string().min(1, 'Please select a batch'),
    subject: z.string().min(1, 'Subject is required'),
    totalMarks: z.coerce.number().min(1, 'Total marks must be greater than zero'),
    passingMarks: z.coerce.number().min(1, 'Passing marks must be greater than zero'),
    correctMarks: z.coerce.number().default(4),
    negativeMarks: z.coerce.number().default(1),
    status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED']).default('UPCOMING'),
  })
  .refine((data) => data.passingMarks <= data.totalMarks, {
    message: 'Passing marks cannot exceed total marks',
    path: ['passingMarks'],
  });

type ExamFormValues = z.infer<typeof examSchema>;

interface ExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialExam?: Examination | null;
}

export const ExamFormModal: React.FC<ExamFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialExam,
}) => {
  const { success, error } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: '',
      examPattern: 'JEE_MAIN',
      examDate: new Date().toISOString().split('T')[0],
      batchId: '',
      subject: '',
      totalMarks: 300,
      passingMarks: 120,
      correctMarks: 4,
      negativeMarks: 1,
      status: 'UPCOMING',
    },
  });

  const selectedBatchId = watch('batchId');

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res = await batchApi.getAll({ status: 'ACTIVE' });
        setBatches(res.data.data);
      } catch (err) {
        console.error('Failed to load batches', err);
      }
    };
    if (isOpen) loadBatches();
  }, [isOpen]);

  useEffect(() => {
    if (initialExam) {
      reset({
        title: initialExam.title,
        examPattern: (initialExam.examPattern as any) || 'JEE_MAIN',
        examDate: initialExam.examDate,
        batchId: initialExam.batchId,
        subject: initialExam.subject,
        totalMarks: initialExam.totalMarks,
        passingMarks: initialExam.passingMarks,
        correctMarks: initialExam.correctMarks || 4,
        negativeMarks: initialExam.negativeMarks || 1,
        status: initialExam.status,
      });
    } else {
      reset({
        title: '',
        examPattern: 'JEE_MAIN',
        examDate: new Date().toISOString().split('T')[0],
        batchId: '',
        subject: '',
        totalMarks: 300,
        passingMarks: 120,
        correctMarks: 4,
        negativeMarks: 1,
        status: 'UPCOMING',
      });
    }
  }, [initialExam, reset, isOpen]);

  useEffect(() => {
    if (selectedBatchId && !initialExam) {
      const b = batches.find((x) => x.id === selectedBatchId);
      if (b) {
        setValue('subject', b.course?.name || '');
      }
    }
  }, [selectedBatchId, batches, initialExam, setValue]);

  const onSubmit = async (values: ExamFormValues) => {
    setIsSubmitting(true);
    try {
      if (initialExam) {
        await examApi.update(initialExam.id, values);
        success('Exam Updated', 'Examination schedule and negative marking criteria saved');
      } else {
        await examApi.create(values);
        success('Exam Created', 'New test series examination scheduled successfully');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Validation Error', err.response?.data?.message || 'Could not schedule exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialExam ? `Edit Test: ${initialExam.examId}` : 'Schedule Test Series / Exam'}
      subtitle="Configure National Pattern (JEE/NEET), negative marking scheme, and passing threshold"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Exam Title *
          </label>
          <input
            type="text"
            {...register('title')}
            placeholder="e.g. All-India Open Mock Test #03 (Full Syllabus)"
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 font-bold"
          />
          {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Exam Pattern *
            </label>
            <select
              {...register('examPattern')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
            >
              <option value="JEE_MAIN">JEE Main (+4 / -1)</option>
              <option value="JEE_ADVANCED">JEE Advanced (Multi-type)</option>
              <option value="NEET_UG">NEET-UG (720 Marks, +4 / -1)</option>
              <option value="BOARD_TERM">Board Term Assessment</option>
              <option value="OLYMPIAD">Science & Math Olympiad</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Batch *
            </label>
            <select
              {...register('batchId')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            >
              <option value="">Select Cohort Batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Examination Date *
            </label>
            <input
              type="date"
              {...register('examDate')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject Scope *
            </label>
            <input
              type="text"
              {...register('subject')}
              placeholder="e.g. Full Mock / Physics / Math"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Total Marks *
            </label>
            <input
              type="number"
              step="any"
              {...register('totalMarks')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Passing Threshold Marks *
            </label>
            <input
              type="number"
              step="any"
              {...register('passingMarks')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Marks per Correct Answer (+)
            </label>
            <input
              type="number"
              step="any"
              {...register('correctMarks')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Negative Penalty per Wrong Answer (-)
            </label>
            <input
              type="number"
              step="any"
              {...register('negativeMarks')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-rose-600 dark:text-rose-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : initialExam ? 'Save Changes' : 'Schedule Test'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
