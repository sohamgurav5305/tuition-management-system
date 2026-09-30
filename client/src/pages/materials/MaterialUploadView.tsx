import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Upload,
  FileText,
  Users,
  BookOpen,
  Layers,
  X,
  Paperclip,
  ArrowLeft,
  Tag,
  Bookmark,
} from 'lucide-react';
import { materialApi, batchApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Batch } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';

const materialSchema = z.object({
  title: z.string().min(2, 'Document name is required'),
  materialType: z.string().default('CLASS_NOTES'),
  batchId: z.string().min(1, 'Please select the target class batch'),
  subject: z.string().min(1, 'Subject is required'),
  chapterName: z.string().default(''),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

interface MaterialUploadViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const MaterialUploadView: React.FC<MaterialUploadViewProps> = ({
  onBack,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([
    'Physics',
    'Chemistry',
    'Mathematics',
    'Biology',
  ]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
      materialType: 'CLASS_NOTES',
      batchId: '',
      subject: 'Physics',
      chapterName: '',
    },
  });

  const selectedBatchId = watch('batchId');

  useEffect(() => {
    batchApi.getAll({ status: 'ACTIVE' }).then((r) => {
      const list = r.data.data;
      setBatches(list);
      if (list.length > 0) {
        setValue('batchId', list[0].id);
      }
    });
    reset();
    setSelectedFiles([]);
  }, [reset, setValue]);

  useEffect(() => {
    if (selectedBatchId) {
      const b = batches.find((x) => x.id === selectedBatchId);
      if (b && b.course?.subjects) {
        try {
          const subs = JSON.parse(b.course.subjects);
          if (Array.isArray(subs) && subs.length > 0) {
            setAvailableSubjects(subs);
            setValue('subject', subs[0]);
          }
        } catch {
          const subs = b.course.subjects.split(',').map((s: string) => s.trim());
          if (subs.length > 0) {
            setAvailableSubjects(subs);
            setValue('subject', subs[0]);
          }
        }
      }
    }
  }, [selectedBatchId, batches, setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: MaterialFormValues) => {
    const formData = new FormData();
    formData.append('title', values.title.trim());
    formData.append('materialType', values.materialType || 'CLASS_NOTES');
    formData.append('batchId', values.batchId);
    formData.append('subject', values.subject);
    formData.append('chapterName', (values.chapterName || '').trim());

    const b = batches.find((x) => x.id === values.batchId);
    if (b) {
      formData.append('courseId', b.courseId);
    }

    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
    }

    try {
      await materialApi.create(formData);
      success(
        'Study Material Published',
        `Documents uploaded and made available exclusively to ${b?.name || 'the batch'}`
      );
      onSuccess();
    } catch (err: any) {
      error('Upload Error', err.response?.data?.message || err.message);
    }
  };

  const selectedBatchObj = batches.find((b) => b.id === selectedBatchId);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={onBack}
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          Back to Study Materials
        </Button>
      </div>

      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <PageHeader title="Upload Study Materials" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Mandatory Batch Selector */}
          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl space-y-2">
            <label className="block text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Target Batch * (Required)
            </label>
            <select
              {...register('batchId')}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-800 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Choose Target Batch --</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.course?.name})
                </option>
              ))}
            </select>
            {errors.batchId && (
              <p className="text-xs text-rose-500 font-bold mt-1">{errors.batchId.message}</p>
            )}

            {selectedBatchObj && (
              <div className="flex items-center gap-2 text-[11px] text-blue-800 dark:text-blue-300 pt-1">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>
                  Academic Program: <strong>{selectedBatchObj.course?.name || 'Selected Course'}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Document Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Document Name *
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g. Kinematics Problem Set 01"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400"
              />
              {errors.title && (
                <p className="text-xs text-rose-500 font-bold mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Category / Material Type *
              </label>
              <select
                {...register('materialType')}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-semibold"
              >
                <option value="CLASS_NOTES">Class Notes</option>
                <option value="DPP">Daily Practice Problems (DPP)</option>
                <option value="FORMULA_SHEET">Formula Sheets</option>
                <option value="QUESTION_BANK">Question Banks</option>
                <option value="TEST_SOLUTION">Test Solution Keys</option>
              </select>
            </div>
          </div>

          {/* Subject & Chapter Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Subject *
              </label>
              <select
                {...register('subject')}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Chapter / Topic (Optional)
              </label>
              <input
                type="text"
                {...register('chapterName')}
                placeholder="e.g. Chapter 3: Laws of Motion"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400"
              />
            </div>
          </div>

          {/* File Upload (Multiple Files) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Attachments (Multiple Files Allowed)
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                PDF, DOCX, ZIP, Images (Max 25MB each)
              </span>
            </label>
            <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/60 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            {/* Selected Files Preview Chips */}
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Selected Documents ({selectedFiles.length}):
                </p>
                <div className="flex flex-wrap gap-2.5 max-h-40 overflow-y-auto p-1 pt-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative group flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 text-xs font-semibold shadow-xs"
                    >
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="truncate max-w-[180px]" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer z-10"
                        title="Delete attachment"
                        aria-label={`Delete ${file.name}`}
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBack}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={Upload}
            >
              {isSubmitting ? 'Uploading...' : 'Publish to Batch'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
