import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, BookOpen, GraduationCap } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { assignmentApi, batchApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Batch, Assignment } from '../../types';

const assignmentSchema = z.object({
  title: z.string().min(1, 'Assignment title is required'),
  description: z.string().min(1, 'Description is required'),
  batchId: z.string().min(1, 'Please select a batch'),
  subject: z.string().min(1, 'Subject is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  totalMarks: z.coerce.number().min(1, 'Total marks must be greater than zero'),
  status: z.enum(['OPEN', 'CLOSED']).default('OPEN'),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialAssignment?: Assignment | null;
}

export const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAssignment,
}) => {
  const { success, error } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([
    'Physics',
    'Chemistry',
    'Mathematics',
    'Botany',
    'Zoology',
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      batchId: '',
      subject: 'Physics',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      totalMarks: 100,
      status: 'OPEN',
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
    if (initialAssignment) {
      reset({
        title: initialAssignment.title,
        description: initialAssignment.description,
        batchId: initialAssignment.batchId,
        subject: initialAssignment.subject,
        dueDate: initialAssignment.dueDate,
        totalMarks: initialAssignment.totalMarks,
        status: initialAssignment.status,
      });
    } else {
      reset({
        title: '',
        description: '',
        batchId: '',
        subject: 'Physics',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        totalMarks: 100,
        status: 'OPEN',
      });
    }
    setSelectedFile(null);
  }, [initialAssignment, reset, isOpen]);

  useEffect(() => {
    if (selectedBatchId) {
      const b = batches.find((x) => x.id === selectedBatchId);
      if (b && b.course?.subjects) {
        try {
          const subs = JSON.parse(b.course.subjects);
          setAvailableSubjects(subs);
          if (!initialAssignment && subs.length > 0) {
            setValue('subject', subs[0]);
          }
        } catch {
          const subs = b.course.subjects.split(',').map((s: string) => s.trim());
          setAvailableSubjects(subs);
          if (!initialAssignment && subs.length > 0) {
            setValue('subject', subs[0]);
          }
        }
      }
    }
  }, [selectedBatchId, batches, initialAssignment, setValue]);

  const onSubmit = async (values: AssignmentFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        formData.append(k, String(v));
      });

      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      if (initialAssignment) {
        await assignmentApi.update(initialAssignment.id, formData);
        success('Assignment Updated', 'Coursework instructions updated successfully');
      } else {
        await assignmentApi.create(formData);
        success('Assignment Published', 'New assignment announced to student cohort');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Error', err.response?.data?.message || 'Could not save assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialAssignment ? `Edit Assignment: ${initialAssignment.assignmentId}` : 'Create Subject Assignment'}
      subtitle="Publish problem sets, homework instructions, attachments, and due dates"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            Assignment Title *
          </label>
          <input
            type="text"
            {...register('title')}
            placeholder="e.g. Problem Set 4: Rotational Dynamics"
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
          />
          {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            Description & Instructions *
          </label>
          <textarea
            rows={3}
            {...register('description')}
            placeholder="Please write down full solutions for questions 1 to 15..."
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
          />
          {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Assigned Batch *
            </label>
            <select
              {...register('batchId')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
            >
              <option value="">Select Batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.batchId && <p className="text-xs text-rose-500 mt-1">{errors.batchId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-blue-600" /> Subject *
            </label>
            <select
              {...register('subject')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 font-semibold"
            >
              {availableSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Submission Due Date *
            </label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Maximum Marks *
            </label>
            <input
              type="number"
              step="any"
              {...register('totalMarks')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            Attachment Document (Optional PDF / Sheet)
          </label>
          <input
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
            }}
            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : initialAssignment ? 'Update Assignment' : 'Publish Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
