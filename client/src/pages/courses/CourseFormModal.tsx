import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, X, BookOpen, Layers, Sparkles } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { courseApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Course } from '../../types';

const courseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  targetExam: z.string().min(1, 'Target exam stream is required'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  description: z.string().min(1, 'Description is required'),
  duration: z.string().min(1, 'Duration is required'),
  fee: z.coerce.number().min(0, 'Course fee must be positive'),
  status: z.string().default('ACTIVE'),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const PRESET_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology', 'Computer Science', 'English'];

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCourse?: Course | null;
}

export const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCourse,
}) => {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<string[]>(['Physics', 'Chemistry', 'Mathematics']);
  const [newSubjectInput, setNewSubjectInput] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      targetExam: 'JEE',
      gradeLevel: '11th',
      description: '',
      duration: '12 Months',
      fee: 1500,
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (initialCourse) {
      reset({
        name: initialCourse.name,
        targetExam: initialCourse.targetExam || 'JEE',
        gradeLevel: initialCourse.gradeLevel || '11th',
        description: initialCourse.description,
        duration: initialCourse.duration,
        fee: initialCourse.fee,
        status: initialCourse.status,
      });

      if (initialCourse.subjects) {
        try {
          const parsed = typeof initialCourse.subjects === 'string'
            ? JSON.parse(initialCourse.subjects)
            : initialCourse.subjects;
          setSubjects(Array.isArray(parsed) ? parsed : ['Physics', 'Chemistry', 'Mathematics']);
        } catch {
          setSubjects(initialCourse.subjects.split(',').map((s) => s.trim()).filter(Boolean));
        }
      } else {
        setSubjects(['Physics', 'Chemistry', 'Mathematics']);
      }
    } else {
      reset({
        name: '',
        targetExam: 'JEE',
        gradeLevel: '11th',
        description: '',
        duration: '12 Months',
        fee: 1500,
        status: 'ACTIVE',
      });
      setSubjects(['Physics', 'Chemistry', 'Mathematics']);
    }
  }, [initialCourse, reset, isOpen]);

  const handleAddSubject = () => {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) return;
    if (subjects.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      error('Duplicate Subject', `"${trimmed}" is already added to this course.`);
      return;
    }
    setSubjects((prev) => [...prev, trimmed]);
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    setSubjects((prev) => prev.filter((s) => s !== subjectToRemove));
  };

  const handleAddPreset = (preset: string) => {
    if (!subjects.some((s) => s.toLowerCase() === preset.toLowerCase())) {
      setSubjects((prev) => [...prev, preset]);
    }
  };

  const onSubmit = async (values: CourseFormValues) => {
    if (subjects.length === 0) {
      error('Subjects Required', 'Please specify at least one subject taught in this course.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...values,
      subjects,
    };

    try {
      if (initialCourse) {
        await courseApi.update(initialCourse.id, payload);
        success('Course Updated', 'Course curriculum and subject structure updated');
      } else {
        await courseApi.create(payload);
        success('Course Created', 'New academic program and subjects registered');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Error', err.response?.data?.message || 'Could not save course');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialCourse ? `Edit Program: ${initialCourse.courseId}` : 'Create Academic Program'}
      subtitle="Define course name, curriculum subjects, target competitive stream, duration, and tuition fee structure"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* 1. Program Name First */}
        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-300">
            1. Program / Course Name *
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="e.g. JEE Advanced 2-Year Leader Program (Class 11 & 12)"
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 font-bold"
          />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
        </div>

        {/* 2. Course Subjects Second */}
        <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-300">
              2. Curriculum Subjects for this Course *
            </label>
            <span className="text-xs text-purple-700 dark:text-purple-400 font-semibold">
              {subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'} Configured
            </span>
          </div>

          {/* New Subject Input Box */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubject();
                }
              }}
              placeholder="Enter subject name (e.g. Physics, Organic Chemistry, Calculus)..."
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleAddSubject}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-purple-500/20"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>

          {/* Configured Subjects Tags */}
          <div className="flex flex-wrap gap-2 pt-1">
            {subjects.map((subj) => (
              <span
                key={subj}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 rounded-xl text-xs font-bold shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                {subj}
                <button
                  type="button"
                  onClick={() => handleRemoveSubject(subj)}
                  className="p-0.5 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-full text-purple-500 hover:text-rose-600 transition-colors"
                  title={`Remove ${subj}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Quick Presets */}
          <div className="pt-2 border-t border-purple-100/60 dark:border-purple-900/40">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SUBJECTS.map((preset) => {
                const isAdded = subjects.some((s) => s.toLowerCase() === preset.toLowerCase());
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={isAdded}
                    onClick={() => handleAddPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      isAdded
                        ? 'opacity-40 bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600'
                    }`}
                  >
                    + {preset}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Stream & Grade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Stream *
            </label>
            <select
              {...register('targetExam')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold"
            >
              <option value="JEE">JEE Main & Advanced</option>
              <option value="NEET">NEET-UG Medical</option>
              <option value="FOUNDATION">Foundation Olympiads (8-10)</option>
              <option value="SAT">SAT / ACT</option>
              <option value="BOARDS">Boards & CUET</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Grade Level *
            </label>
            <select
              {...register('gradeLevel')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold"
            >
              <option value="8th-10th">Class 8th - 10th</option>
              <option value="11th">Class 11th</option>
              <option value="12th">Class 12th</option>
              <option value="Dropper">Dropper / 12th Pass</option>
            </select>
          </div>
        </div>

        {/* 4. Duration & Fee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Program Duration *
            </label>
            <input
              type="text"
              {...register('duration')}
              placeholder="e.g. 24 Months / 2 Years"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Standard Tuition Fee ($) *
            </label>
            <input
              type="number"
              step="any"
              {...register('fee')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* 5. Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Program Description *
          </label>
          <textarea
            rows={2}
            {...register('description')}
            placeholder="Detailed course scope, curriculum objectives, and target benchmarks..."
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100"
          />
          {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : initialCourse ? 'Save Changes' : 'Create Program'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
