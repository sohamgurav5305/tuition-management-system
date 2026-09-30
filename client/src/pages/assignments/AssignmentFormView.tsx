import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Upload,
  BookOpen,
  Users,
  X,
  FileText,
  Paperclip,
  Eye,
  ArrowLeft,
  Calendar,
  Award,
} from 'lucide-react';
import { assignmentApi, batchApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Batch, Assignment } from '../../types';
import { getMediaUrl } from '../../utils/media';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';

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

function getAttachmentDisplayName(url: string, index: number): string {
  if (!url) return `Attachment #${index + 1}`;
  const rawName = url.split('/').pop()?.split('?')[0] || '';
  if (!rawName) return `Attachment #${index + 1}`;

  const uuidPrefixed = rawName.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/);
  if (uuidPrefixed && uuidPrefixed[1]) {
    return decodeURIComponent(uuidPrefixed[1]);
  }

  const isPureUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.([a-zA-Z0-9]+)$/.test(rawName);
  if (isPureUuid) {
    const ext = rawName.split('.').pop()?.toUpperCase();
    return `Attachment #${index + 1}${ext ? ` (${ext})` : ''}`;
  }

  return decodeURIComponent(rawName);
}

interface AssignmentFormViewProps {
  onClose: () => void;
  onSuccess: () => void;
  initialAssignment?: Assignment | null;
}

export const AssignmentFormView: React.FC<AssignmentFormViewProps> = ({
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
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
    loadBatches();
  }, []);

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
      const initialFiles =
        initialAssignment.attachments && initialAssignment.attachments.length > 0
          ? initialAssignment.attachments
          : initialAssignment.attachmentUrl
          ? [initialAssignment.attachmentUrl]
          : [];
      setExistingAttachments(initialFiles);
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
      setExistingAttachments([]);
    }
    setSelectedFiles([]);
  }, [initialAssignment, reset]);

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

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: AssignmentFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        formData.append(k, String(v));
      });

      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });
      }

      if (initialAssignment) {
        formData.append('existingAttachments', JSON.stringify(existingAttachments));
        await assignmentApi.update(initialAssignment.id, formData);
        success('Assignment Updated', 'Assignments instructions updated successfully');
      } else {
        await assignmentApi.create(formData);
        success('Assignment Published', 'New assignment announced to student Batch');
      }
      onSuccess();
    } catch (err: any) {
      error('Error', err.response?.data?.message || 'Could not save assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={onClose}
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          {initialAssignment ? 'Back to Assignment Details' : 'Back to Assignments'}
        </Button>
      </div>

      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <PageHeader
          title={initialAssignment ? 'Edit Assignment' : 'Create Assignment'}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Assignment Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Assignment Title *
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Thermodynamics Practice Problem Set 01"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400"
            />
            {errors.title && <p className="text-xs text-rose-500 font-bold mt-1">{errors.title.message}</p>}
          </div>

          {/* Description & Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Description & Instructions *
            </label>
            <textarea
              rows={4}
              {...register('description')}
              placeholder="Please write down full solutions for questions 1 to 15..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400"
            />
            {errors.description && (
              <p className="text-xs text-rose-500 font-bold mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Grid: Batch & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Assigned Batch *
              </label>
              <select
                {...register('batchId')}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-bold"
              >
                <option value="">-- Select Target Batch --</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.course?.name})
                  </option>
                ))}
              </select>
              {errors.batchId && (
                <p className="text-xs text-rose-500 font-bold mt-1">{errors.batchId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Subject *
              </label>
              <select
                {...register('subject')}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-bold"
              >
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid: Due Date & Maximum Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Submission Due Date *
              </label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-medium"
              />
              {errors.dueDate && (
                <p className="text-xs text-rose-500 font-bold mt-1">{errors.dueDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Maximum Marks *
              </label>
              <input
                type="number"
                step="any"
                {...register('totalMarks')}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-medium"
              />
              {errors.totalMarks && (
                <p className="text-xs text-rose-500 font-bold mt-1">{errors.totalMarks.message}</p>
              )}
            </div>
          </div>

          {/* Attachments (Multiple Files Allowed) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Attachments (Multiple Files Allowed)
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                PDF, Word, Excel, Images (Max 25MB each)
              </span>
            </label>
            <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/60 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            {/* Newly selected files list */}
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Selected Files to Upload ({selectedFiles.length}):
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

            {/* Existing attachments when editing */}
            {initialAssignment && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Existing Attachments on File ({existingAttachments.length}):
                  </span>
                  {existingAttachments.length === 0 && (
                    <span className="text-[11px] text-rose-500 font-medium">
                      (No attachments kept)
                    </span>
                  )}
                </div>
                {existingAttachments.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {existingAttachments.map((url, i) => {
                      const displayName = getAttachmentDisplayName(url, i);

                      return (
                        <div
                          key={i}
                          className="relative group inline-flex items-center gap-2 pl-3 pr-3.5 py-1.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-medium shadow-2xs"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <span className="font-semibold text-blue-900 dark:text-blue-200 truncate max-w-[150px]" title={displayName}>
                            {displayName}
                          </span>
                          <a
                            href={getMediaUrl(url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 rounded-md transition-colors text-[11px] font-bold ml-0.5"
                            title={`View: ${displayName}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeExistingAttachment(i);
                            }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer z-10"
                            title="Delete attachment"
                            aria-label={`Delete ${displayName}`}
                          >
                            <X className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                    No existing attachments remaining on file.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
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
              {isSubmitting ? 'Saving...' : initialAssignment ? 'Update Assignment' : 'Publish Assignment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
