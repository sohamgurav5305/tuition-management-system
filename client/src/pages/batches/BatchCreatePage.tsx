import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Clock,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Check,
  Users,
} from 'lucide-react';
import { batchApi, courseApi, facultyApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
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

export const BatchCreatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingBatch, setExistingBatch] = useState<Batch | null>(null);

  // Deletion in edit mode
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Subject-wise faculty assignments: { [subjectName: string]: facultyId }
  const [subjectTeachers, setSubjectTeachers] = useState<Record<string, string>>({});
  const [courseSubjects, setCourseSubjects] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      name: '',
      courseId: '',
      classroom: 'Lecture Hall 101',
      startDate: '2026-09-01',
      endDate: '2027-05-31',
      startTime: '09:00',
      endTime: '10:30',
      status: 'ACTIVE',
    },
  });

  const selectedCourseId = watch('courseId');

  // Load courses, faculty, and if editing, existing batch
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [crsRes, facRes] = await Promise.all([
          courseApi.getAll('ACTIVE'),
          facultyApi.getAll(),
        ]);
        const fetchedCourses = crsRes.data?.data || [];
        const fetchedFaculty = facRes.data?.data || [];
        setCourses(fetchedCourses);
        setFaculty(fetchedFaculty);

        if (id) {
          const batchRes = await batchApi.getById(id);
          const batchData: Batch = batchRes.data?.data;
          if (batchData) {
            setExistingBatch(batchData);
            reset({
              name: batchData.name,
              courseId: batchData.courseId,
              classroom: batchData.classroom || 'General',
              startDate: batchData.startDate ? new Date(batchData.startDate).toISOString().split('T')[0] : '2026-09-01',
              endDate: batchData.endDate ? new Date(batchData.endDate).toISOString().split('T')[0] : '2027-05-31',
              startTime: batchData.startTime,
              endTime: batchData.endTime,
              status: batchData.status || 'ACTIVE',
            });

            // Parse days
            try {
              const parsedDays = typeof batchData.daysOfWeek === 'string'
                ? JSON.parse(batchData.daysOfWeek)
                : batchData.daysOfWeek;
              setSelectedDays(Array.isArray(parsedDays) ? parsedDays : ['Mon', 'Wed', 'Fri']);
            } catch {
              setSelectedDays(['Mon', 'Wed', 'Fri']);
            }

            // Parse subject teachers
            if (batchData.subjectTeachers) {
              try {
                const map = typeof batchData.subjectTeachers === 'string'
                  ? JSON.parse(batchData.subjectTeachers)
                  : batchData.subjectTeachers;
                setSubjectTeachers(map || {});
              } catch {}
            }
          } else {
            toastError('Batch Not Found', 'Could not find the requested batch');
            navigate('/batches');
          }
        }
      } catch (err: any) {
        console.error('Failed to load batch data', err);
        toastError('Failed to Load', err.message || 'Could not load data');
        navigate('/batches');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id, reset, navigate]);

  // When course changes, resolve its subjects and auto-populate map
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
      setConflictError('Please select at least one day of the week for the batch class schedule.');
      return;
    }
    if (values.startTime >= values.endTime) {
      setConflictError('Batch end time must be later than start time.');
      return;
    }

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
      if (isEditMode && id) {
        await batchApi.update(id, payload);
        success('Batch Updated', 'Batch schedule and subject-teacher assignments updated');
      } else {
        await batchApi.create(payload);
        success('Batch Created', 'New class batch created with subject faculty assignments');
      }
      navigate('/batches');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Schedule conflict occurred';
      setConflictError(msg);
      toastError('Conflict Validation Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await batchApi.delete(id);
      success('Batch Deleted', 'Batch class group removed from system');
      navigate('/batches');
    } catch (err: any) {
      toastError('Delete Failed', err.response?.data?.message || 'Cannot delete batch with enrolled students');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-6">
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Top Navigation Header */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/batches')}
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          Back to Batches
        </Button>
      </div>

      {/* Main Page Title Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {isEditMode ? `Edit Batch` : `Create Batch`}
            </h1>
          </div>

          {existingBatch?.batchId && (
            <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs self-start sm:self-auto">
              ID: {existingBatch.batchId}
            </div>
          )}
        </div>
      </div>

      {conflictError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-3 text-xs text-rose-800 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Schedule Conflict or Validation Error</p>
            <p className="mt-0.5">{conflictError}</p>
          </div>
        </div>
      )}

      {/* Batch Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Course Selection & Batch Information */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            1. Course Program & Batch Name
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Course <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('courseId')}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.targetExam || 'General'})
                  </option>
                ))}
              </select>
              {errors.courseId && (
                <p className="text-[11px] text-rose-500 mt-0.5">{errors.courseId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Batch Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. 12th Morning - JEE Rankers"
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
              {errors.name && (
                <p className="text-[11px] text-rose-500 mt-0.5">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Classroom / Room No
              </label>
              <input
                type="text"
                {...register('classroom')}
                placeholder="e.g. Lecture Hall 101, Lab 2"
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Batch Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE (Running Classes)</option>
                <option value="COMPLETED">COMPLETED (Course Finished)</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Subject-Wise Faculty Assignments */}
        <div className="bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-900/60 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              2. Assign Faculty to Subjects
            </h2>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-200/60 dark:border-purple-800">
              {courseSubjects.length} {courseSubjects.length === 1 ? 'Subject' : 'Subjects'} to assign
            </span>
          </div>

          {courseSubjects.length === 0 ? (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
              <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Please select a course above to configure subject faculty assignments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courseSubjects.map((subject) => {
                const currentFacId = subjectTeachers[subject] || '';
                return (
                  <div
                    key={subject}
                    className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                        {subject}
                      </span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md font-semibold">
                        Subject Specialist
                      </span>
                    </div>

                    <select
                      value={currentFacId}
                      onChange={(e) => handleSubjectFacultyChange(subject, e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                    >
                      <option value="">-- Select Faculty for {subject} --</option>
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
          )}
        </div>

        {/* Section 3: Class Schedule & Timings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            3. Class Schedule (Days & Class Hours)
          </h2>

          <div className="space-y-4">
            {/* Days Selection Pills */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Class Days *
              </label>
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
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Start Time *
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="time"
                    {...register('startTime')}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                {errors.startTime && (
                  <p className="text-[11px] text-rose-500 mt-0.5">{errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  End Time *
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="time"
                    {...register('endTime')}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                {errors.endTime && (
                  <p className="text-[11px] text-rose-500 mt-0.5">{errors.endTime.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    {...register('startDate')}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                {errors.startDate && (
                  <p className="text-[11px] text-rose-500 mt-0.5">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  End Date *
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    {...register('endDate')}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                {errors.endDate && (
                  <p className="text-[11px] text-rose-500 mt-0.5">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Enrolled Students (When viewing/editing existing batch) */}
        {isEditMode && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Enrolled Students ({existingBatch?.students?.length || 0})
              </h2>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 font-bold">Student ID</th>
                    <th className="px-4 py-2.5 font-bold">Name</th>
                    <th className="px-4 py-2.5 font-bold">Contact Phone</th>
                    <th className="px-4 py-2.5 font-bold">Parent / Guardian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {existingBatch?.students && existingBatch.students.length > 0 ? (
                    existingBatch.students.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => navigate(`/students/${s.id}`)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">{s.studentId}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                          {s.firstName} {s.lastName}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{s.phone || '—'}</td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                          {s.guardianName ? `${s.guardianName} ${s.guardianPhone ? `(${s.guardianPhone})` : ''}` : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                        No students enrolled in this batch yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate('/batches')}
            >
              Cancel
            </Button>

            {isEditMode && (
              <Button
                type="button"
                variant="danger"
                size="md"
                leftIcon={Trash2}
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete Batch
              </Button>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={CheckCircle2}
          >
            {isSubmitting
              ? 'Saving Batch...'
              : isEditMode
              ? 'Update Batch Group'
              : 'Create Batch Group'}
          </Button>
        </div>
      </form>

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Batch Group"
        message={`Are you sure you want to permanently delete batch "${existingBatch?.name || ''}"? All enrolled student assignments should be cleared prior to removal.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default BatchCreatePage;
