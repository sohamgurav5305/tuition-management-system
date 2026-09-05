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
  duration: z.string().min(1, 'Duration is required'),
  fee: z.coerce.number().min(0, 'Course fee must be positive'),
  status: z.string().default('ACTIVE'),
  targetExam: z.string().optional().default('General'),
  gradeLevel: z.string().optional().default('General'),
  description: z.string().optional().default(''),
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
      targetExam: 'General',
      gradeLevel: 'General',
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
        targetExam: initialCourse.targetExam || 'General',
        gradeLevel: initialCourse.gradeLevel || 'General',
        description: initialCourse.description || '',
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
        targetExam: 'General',
        gradeLevel: 'General',
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
      targetExam: values.targetExam || initialCourse?.targetExam || 'General',
      gradeLevel: values.gradeLevel || initialCourse?.gradeLevel || 'General',
      description: values.description || initialCourse?.description || '',
      subjects,
    };

    try {
      if (initialCourse) {
        await courseApi.update(initialCourse.id, payload);
        success('Course Updated', 'Course curriculum and subject structure updated');
      } else {
        await courseApi.create(payload);
        success('Course Created', 'New course and subjects registered');
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
      title={initialCourse ? `Edit Course: ${initialCourse.courseId}` : 'Create Course'}
      subtitle="Define course name, curriculum subjects, duration, and fee structure"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* 1. Course Name First */}
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-blue-900">
            Course Name *
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="Enter Course name"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-bold"
          />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
        </div>

        {/* 2. Course Subjects Second */}
        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black uppercase tracking-wider text-purple-900">
              Curriculum Subjects *
            </label>
            <span className="text-xs text-purple-700 font-semibold">
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
              placeholder="Enter subject name"
              className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-purple-200 text-purple-800 rounded-xl text-xs font-bold shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                {subj}
                <button
                  type="button"
                  onClick={() => handleRemoveSubject(subj)}
                  className="p-0.5 hover:bg-purple-100 rounded-full text-purple-500 hover:text-rose-600 transition-colors"
                  title={`Remove ${subj}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Quick Presets */}
          <div className="pt-2 border-t border-purple-100/60">
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
                        ? 'opacity-40 bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-purple-400 hover:text-purple-600'
                    }`}
                  >
                    + {preset}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Duration & Fee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Course Duration *
            </label>
            <input
              type="text"
              {...register('duration')}
              placeholder=""
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fees (₹) *
            </label>
            <input
              type="number"
              step="any"
              {...register('fee')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : initialCourse ? 'Save Changes' : 'Create Course'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
