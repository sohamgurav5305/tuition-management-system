import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, BookOpen, GraduationCap, X, FileText, Paperclip, Eye } from 'lucide-react';
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

function getAttachmentDisplayName(url: string, index: number): string {
  if (!url) return `Attachment #${index + 1}`;
  const rawName = url.split('/').pop()?.split('?')[0] || '';
  if (!rawName) return `Attachment #${index + 1}`;

  // Match standard UUID prefix with hyphen (e.g., "12345678-1234-1234-1234-123456789abc-ActualFileName.pdf")
  const uuidPrefixed = rawName.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/);
  if (uuidPrefixed && uuidPrefixed[1]) {
    return decodeURIComponent(uuidPrefixed[1]);
  }

  // Pure UUID filename without suffix (e.g., "12345678-1234-1234-1234-123456789abc.pdf")
  const isPureUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.([a-zA-Z0-9]+)$/.test(rawName);
  if (isPureUuid) {
    const ext = rawName.split('.').pop()?.toUpperCase();
    return `Attachment #${index + 1}${ext ? ` (${ext})` : ''}`;
  }

  return decodeURIComponent(rawName);
}

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
    // reset input value so re-selecting same file triggers onChange
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
      title={initialAssignment ? 'Edit Assignment' : 'Create Subject Assignment'}
      subtitle=""
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Assignment Title *
          </label>
          <input
            type="text"
            {...register('title')}
            placeholder=""
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
          />
          {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Description & Instructions *
          </label>
          <textarea
            rows={3}
            {...register('description')}
            placeholder="Please write down full solutions for questions 1 to 15..."
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
          />
          {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Assigned Batch *
            </label>
            <select
              {...register('batchId')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
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
            <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-blue-600" /> Subject *
            </label>
            <select
              {...register('subject')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-semibold"
            >
              {availableSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Submission Due Date *
            </label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Maximum Marks *
            </label>
            <input
              type="number"
              step="any"
              {...register('totalMarks')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <Paperclip className="w-3.5 h-3.5 text-blue-600" /> Attachments (Multiple Files Allowed)
            </span>
            <span className="text-[11px] text-slate-400 font-normal">PDF, Word, Excel, Images (Max 25MB each)</span>
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {/* List of newly selected files */}
          {selectedFiles.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-600">
                Selected Files to Upload ({selectedFiles.length}):
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative group flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-semibold shadow-sm"
                  >
                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="truncate max-w-[170px]" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {(file.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer z-10"
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
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Existing Attachments on File ({existingAttachments.length}):
                </span>
                {existingAttachments.length === 0 && (
                  <span className="text-[11px] text-rose-500 font-medium">
                    (No attachments kept)
                  </span>
                )}
              </div>
              {existingAttachments.length > 0 ? (
                <div className="flex flex-wrap gap-3 pt-1">
                  {existingAttachments.map((url, i) => {
                    const displayName = getAttachmentDisplayName(url, i);

                    return (
                      <div
                        key={i}
                        className="relative group inline-flex items-center gap-2 pl-3 pr-3.5 py-1.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-slate-700 text-xs font-medium shadow-2xs"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="font-semibold text-blue-900 truncate max-w-[150px]" title={displayName}>
                          {displayName}
                        </span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100/80 rounded-md transition-colors text-[11px] font-bold ml-0.5"
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
                          className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer z-10"
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
                <p className="text-[11px] text-slate-400 italic">No existing attachments remaining on file.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl"
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
