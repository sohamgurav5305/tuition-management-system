import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, BookOpen, GraduationCap, Clock, Calendar, Users, Layers } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { batchApi, courseApi, facultyApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Course, Faculty, Batch } from '../../types';

const batchSchema = z.object({
  name: z.string().min(1, 'Batch name is required'),
  courseId: z.string().min(1, 'Please select a course'),
  classroom: z.string().default('General'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  status: z.string().default('ACTIVE'),
});

type BatchFormValues = z.infer<typeof batchSchema>;

const DAYS_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface BatchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialBatch?: Batch | null;
}

export const BatchFormModal: React.FC<BatchFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialBatch,
}) => {
  const { success, error } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subject-wise faculty assignments: { [subjectName: string]: facultyId }
  const [subjectTeachers, setSubjectTeachers] = useState<Record<string, string>>({});
  const [courseSubjects, setCourseSubjects] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      name: '',
      courseId: '',
      classroom: 'General',
      startDate: '2026-09-01',
      endDate: '2027-05-31',
      startTime: '09:00',
      endTime: '10:30',
      status: 'ACTIVE',
    },
  });

  const selectedCourseId = watch('courseId');

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [crsRes, facRes] = await Promise.all([
          courseApi.getAll('ACTIVE'),
          facultyApi.getAll(),
        ]);
        setCourses(crsRes.data.data);
        setFaculty(facRes.data.data);
      } catch (err) {
        console.error('Failed to load batch form data', err);
      }
    };
    if (isOpen) {
      loadDependencies();
      setConflictError(null);
    }
  }, [isOpen]);

  // When course changes, resolve its subjects and initialize subject-faculty map
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseSubjects([]);
      return;
    }

    const matchedCourse = courses.find((c) => c.id === selectedCourseId);
    if (!matchedCourse) return;

    let subList: string[] = [];
    if (matchedCourse.subjects) {
      try {
        const parsed = typeof matchedCourse.subjects === 'string'
          ? JSON.parse(matchedCourse.subjects)
          : matchedCourse.subjects;
        subList = Array.isArray(parsed) ? parsed : ['Physics', 'Chemistry', 'Mathematics'];
      } catch {
        subList = matchedCourse.subjects.split(',').map((s) => s.trim()).filter(Boolean);
      }
    } else {
      subList = ['Physics', 'Chemistry', 'Mathematics'];
    }

    setCourseSubjects(subList);

    // If not editing or new course selected, try to auto-match faculty by subject taught
    setSubjectTeachers((prev) => {
      const nextMap: Record<string, string> = { ...prev };
      subList.forEach((subj) => {
        if (!nextMap[subj]) {
          const matchingFac = faculty.find(
            (f) => f.subjectTaught.toLowerCase() === subj.toLowerCase()
          );
          if (matchingFac) {
            nextMap[subj] = matchingFac.id;
          } else if (faculty.length > 0) {
            nextMap[subj] = faculty[0].id;
          }
        }
      });
      return nextMap;
    });
  }, [selectedCourseId, courses, faculty]);

  useEffect(() => {
    if (initialBatch) {
      reset({
        name: initialBatch.name,
        courseId: initialBatch.courseId,
        classroom: initialBatch.classroom,
        startDate: initialBatch.startDate,
        endDate: initialBatch.endDate,
        startTime: initialBatch.startTime,
        endTime: initialBatch.endTime,
        status: initialBatch.status,
      });

      try {
        const parsed = typeof initialBatch.daysOfWeek === 'string'
          ? JSON.parse(initialBatch.daysOfWeek)
          : initialBatch.daysOfWeek;
        setSelectedDays(Array.isArray(parsed) ? parsed : ['Mon', 'Wed', 'Fri']);
      } catch {
        setSelectedDays(['Mon', 'Wed', 'Fri']);
      }

      if (initialBatch.subjectTeachers) {
        try {
          const map = typeof initialBatch.subjectTeachers === 'string'
            ? JSON.parse(initialBatch.subjectTeachers)
            : initialBatch.subjectTeachers;
          setSubjectTeachers(map || {});
        } catch {
          // ignore
        }
      }
    } else {
      reset({
        name: '',
        courseId: '',
        classroom: 'Lecture Hall 101',
        startDate: '2026-09-01',
        endDate: '2027-05-31',
        startTime: '09:00',
        endTime: '10:30',
        status: 'ACTIVE',
      });
      setSelectedDays(['Mon', 'Wed', 'Fri']);
      setSubjectTeachers({});
    }
  }, [initialBatch, reset, isOpen]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubjectFacultyChange = (subject: string, facultyId: string) => {
    setSubjectTeachers((prev) => ({
      ...prev,
      [subject]: facultyId,
    }));
  };

  const onSubmit = async (values: BatchFormValues) => {
    if (selectedDays.length === 0) {
      setConflictError('Please select at least one day of the week for the batch schedule.');
      return;
    }
    if (values.startTime >= values.endTime) {
      setConflictError('Batch end time must be later than start time.');
      return;
    }

    // Determine primary facultyId (either from subjectTeachers or initial faculty)
    const assignedFacIds = Object.values(subjectTeachers).filter(Boolean);
    const primaryFacultyId = assignedFacIds.length > 0 ? assignedFacIds[0] : faculty[0]?.id;

    if (!primaryFacultyId) {
      setConflictError('Please assign at least one faculty instructor to a subject in this batch.');
      return;
    }

    setIsSubmitting(true);
    setConflictError(null);

    const payload = {
      ...values,
      facultyId: primaryFacultyId,
      subjectTeachers: JSON.stringify(subjectTeachers),
      daysOfWeek: selectedDays,
    };

    try {
      if (initialBatch) {
        await batchApi.update(initialBatch.id, payload);
        success('Batch Updated', 'Batch schedule and subject-teacher assignments updated');
      } else {
        await batchApi.create(payload);
        success('Batch Created', 'New class batch created with subject faculty assignments');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Schedule conflict occurred';
      setConflictError(msg);
      error('Conflict Validation Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialBatch ? `Edit Batch: ${initialBatch.batchId}` : 'Create Batch'}
      subtitle="Select course, assign faculty per subject, and set weekly schedule"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {conflictError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Schedule Conflict or Validation Error</p>
              <p className="mt-0.5">{conflictError}</p>
            </div>
          </div>
        )}

        {/* 1. Step 1: Course Selection & Batch Name */}
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-blue-900 mb-1">
                Select Course *
              </label>
              <select
                {...register('courseId')}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-bold"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.courseId && <p className="text-xs text-rose-500 mt-1">{errors.courseId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-blue-900 mb-1">
                Batch Name *
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="Enter batch name"
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-bold"
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
            </div>
          </div>
        </div>

        {/* 2. Step 2: Subject-Wise Faculty Allocation */}
        {selectedCourseId && courseSubjects.length > 0 && (
          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                Assign Faculty to Subjects *
              </label>
              <span className="text-xs text-purple-700 font-semibold">
                {courseSubjects.length} Subjects to assign
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {courseSubjects.map((subj) => {
                const assignedFacId = subjectTeachers[subj] || '';
                return (
                  <div
                    key={subj}
                    className="p-3 bg-white border border-purple-200 rounded-xl space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                        {subj}
                      </span>
                      <span className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">
                        Subject Specialist
                      </span>
                    </div>

                    <select
                      value={assignedFacId}
                      onChange={(e) => handleSubjectFacultyChange(subj, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none"
                    >
                      <option value="">-- Assign Faculty --</option>
                      {faculty.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.firstName} {f.lastName} ({f.subjectTaught})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Step 3: Schedule & Class Hours */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            3. Class Schedule (Days & Class Hours) *
          </label>

          {/* Days of Week Selection */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Class Days:</span>
            <div className="flex flex-wrap gap-2">
              {DAYS_OPTIONS.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Time *</label>
              <input
                type="time"
                {...register('startTime')}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Time *</label>
              <input
                type="time"
                {...register('endTime')}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Date *</label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Date *</label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Validating...' : initialBatch ? 'Save Changes' : 'Create Batch'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
