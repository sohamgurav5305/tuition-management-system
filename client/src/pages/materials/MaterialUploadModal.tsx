import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, FileText, Users, BookOpen, Layers } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { materialApi, batchApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Batch } from '../../types';

const materialSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  materialType: z.enum(['DPP', 'CLASS_NOTES', 'FORMULA_SHEET', 'QUESTION_BANK', 'TEST_SOLUTION']).default('DPP'),
  batchId: z.string().min(1, 'Please select the target class batch'),
  subject: z.string().min(1, 'Subject is required'),
  chapterName: z.string().min(1, 'Chapter / Topic name is required'),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

interface MaterialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MaterialUploadModal: React.FC<MaterialUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([
    'Physics',
    'Chemistry',
    'Mathematics',
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      title: '',
      materialType: 'DPP',
      batchId: '',
      subject: 'Physics',
      chapterName: '',
    },
  });

  const selectedBatchId = watch('batchId');

  useEffect(() => {
    if (isOpen) {
      batchApi.getAll({ status: 'ACTIVE' }).then((r) => {
        const list = r.data.data;
        setBatches(list);
        if (list.length > 0) {
          setValue('batchId', list[0].id);
        }
      });
      reset();
      setSelectedFile(null);
    }
  }, [isOpen, reset, setValue]);

  useEffect(() => {
    if (selectedBatchId) {
      const b = batches.find((x) => x.id === selectedBatchId);
      if (b && b.course?.subjects) {
        try {
          const subs = JSON.parse(b.course.subjects);
          setAvailableSubjects(subs);
          if (subs.length > 0) setValue('subject', subs[0]);
        } catch {
          const subs = b.course.subjects.split(',').map((s: string) => s.trim());
          setAvailableSubjects(subs);
          if (subs.length > 0) setValue('subject', subs[0]);
        }
      }
    }
  }, [selectedBatchId, batches, setValue]);

  const onSubmit = async (values: MaterialFormValues) => {
    const formData = new FormData();
    formData.append('title', values.title.trim());
    formData.append('materialType', values.materialType);
    formData.append('batchId', values.batchId);
    formData.append('subject', values.subject);
    formData.append('chapterName', values.chapterName.trim());

    const b = batches.find((x) => x.id === values.batchId);
    if (b) {
      formData.append('courseId', b.courseId);
    }

    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    try {
      await materialApi.create(formData);
      success(
        'Study Material Published',
        `Document uploaded and made available exclusively to ${b?.name || 'the batch'}`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Upload Error', err.response?.data?.message || err.message);
    }
  };

  const selectedBatchObj = batches.find((b) => b.id === selectedBatchId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Study Material / DPP"
      subtitle="Select the target batch cohort so only enrolled students can access these files"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Mandatory Batch Selector */}
        <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/80 rounded-2xl space-y-2">
          <label className="block text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-600" /> Target Batch Cohort * (Required)
          </label>
          <select
            {...register('batchId')}
            className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">-- Choose Target Batch --</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.course?.name})
              </option>
            ))}
          </select>
          {errors.batchId && <p className="text-xs text-rose-500 font-bold mt-1">{errors.batchId.message}</p>}

          {selectedBatchObj && (
            <div className="flex items-center gap-2 text-[11px] text-blue-800 dark:text-blue-300 pt-1">
              <Layers className="w-3.5 h-3.5" />
              <span>
                Academic Program:{' '}
                <strong>{selectedBatchObj.course?.name}</strong> • Classroom:{' '}
                <strong>{selectedBatchObj.classroom}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Material / Document Title *
          </label>
          <input
            type="text"
            {...register('title')}
            placeholder="e.g. Electrostatics DPP #01 (50 Advanced MCQs)"
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
          />
          {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Document Category *
            </label>
            <select
              {...register('materialType')}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
            >
              <option value="DPP">Daily Practice Problem (DPP)</option>
              <option value="CLASS_NOTES">Classroom Lecture Notes</option>
              <option value="FORMULA_SHEET">Formula Sheet / Mind Map</option>
              <option value="QUESTION_BANK">Question Bank / PYQs</option>
              <option value="TEST_SOLUTION">Mock Test Solution Key</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-blue-600" /> Subject *
            </label>
            <select
              {...register('subject')}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
            >
              {availableSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Chapter / Unit Name *
            </label>
            <input
              type="text"
              {...register('chapterName')}
              placeholder="e.g. Rotational Dynamics & Center of Mass"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
            {errors.chapterName && <p className="text-xs text-rose-500 mt-1">{errors.chapterName.message}</p>}
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Attach PDF Document / Study File
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.zip"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-950 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Upload className="w-4 h-4" /> {isSubmitting ? 'Uploading...' : 'Publish to Batch'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
