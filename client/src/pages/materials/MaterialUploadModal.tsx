import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, FileText, Users, BookOpen, Layers, X, Paperclip, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { materialApi, batchApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Batch } from '../../types';

const materialSchema = z.object({
  title: z.string().min(2, 'Document name is required'),
  materialType: z.string().default('CLASS_NOTES'),
  batchId: z.string().min(1, 'Please select the target class batch'),
  subject: z.string().min(1, 'Subject is required'),
  chapterName: z.string().default(''),
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
    if (isOpen) {
      batchApi.getAll({ status: 'ACTIVE' }).then((r) => {
        const list = r.data.data;
        setBatches(list);
        if (list.length > 0) {
          setValue('batchId', list[0].id);
        }
      });
      reset();
      setSelectedFiles([]);
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
      title="Upload Study Materials"
      subtitle=""
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Mandatory Batch Selector */}
        <div className="p-4 bg-blue-50/50 border border-blue-200/80 rounded-2xl space-y-2">
          <label className="block text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-600" /> Target Batch * (Required)
          </label>
          <select
            {...register('batchId')}
            className="w-full px-3.5 py-2.5 text-xs bg-white border border-blue-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
            <div className="flex items-center gap-2 text-[11px] text-blue-800 pt-1">
              <Layers className="w-3.5 h-3.5" />
              <span>
                Academic Program: <strong>{selectedBatchObj.course?.name || 'Selected Course'}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Document Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Document Name *
          </label>
          <input
            type="text"
            {...register('title')}
            placeholder=""
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
          />
          {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-blue-600" /> Subject *
          </label>
          <select
            {...register('subject')}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
          >
            {availableSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload (Multiple Files) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <Paperclip className="w-3.5 h-3.5 text-blue-600" /> Attachments (Multiple Files Allowed)
            </span>
            <span className="text-[11px] text-slate-400 font-normal">PDF, DOCX, ZIP, Images (Max 25MB each)</span>
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
            onChange={handleFileChange}
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {/* Selected Files Preview Chips */}
          {selectedFiles.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-600">
                Selected Documents ({selectedFiles.length}):
              </p>
              <div className="flex flex-wrap gap-3 max-h-36 overflow-y-auto p-1 pt-2">
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
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl"
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
