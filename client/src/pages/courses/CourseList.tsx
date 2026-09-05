import React, { useEffect, useState } from 'react';
import { PlusCircle, Edit, Trash2, BookOpen, Layers, Users, Clock, Sparkles } from 'lucide-react';
import { courseApi } from '../../services/api';
import { Course } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { CourseFormModal } from './CourseFormModal';

export const CourseList: React.FC = () => {
  const { formatCurrency } = useSettings();
  const { success, error } = useToast();
  const { user } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = user?.role === 'ADMINISTRATOR';
  const canDelete = user?.role === 'ADMINISTRATOR';

  const fetchCourses = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await courseApi.getAll();
      setCourses(res.data.data);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(true);
    const interval = setInterval(() => {
      fetchCourses(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await courseApi.delete(deletingId);
      success('Course Removed', 'Academic program deleted successfully');
      fetchCourses();
      setDeletingId(null);
    } catch (err: any) {
      error('Delete Failed', err.response?.data?.message || 'Could not delete course');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Course>[] = [
    {
      header: 'Course Name',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-xs sm:text-sm">{c.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {c.targetExam && c.targetExam !== 'General' && (
                <Badge variant="primary" size="xs">
                  {c.targetExam}
                </Badge>
              )}
              <span className="text-[11px] text-slate-400 font-mono">
                {c.gradeLevel && c.gradeLevel !== 'General' ? `Class ${c.gradeLevel} • ` : ''}{c.courseId}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Subjects Included',
      cell: (c) => {
        let subjectsList: string[] = [];
        try {
          subjectsList = typeof c.subjects === 'string' ? JSON.parse(c.subjects) : (c.subjects || []);
        } catch {
          subjectsList = [];
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {subjectsList.length > 0 ? (
              subjectsList.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700"
                >
                  {s}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">All Core Subjects</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Duration',
      cell: (c) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> {c.duration}
        </span>
      ),
    },
    {
      header: 'Fees',
      cell: (c) => (
        <span className="text-xs font-bold text-slate-900 tabular-nums">
          {formatCurrency(c.fee)}
        </span>
      ),
    },
    {
      header: 'Batches Running',
      cell: (c) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
          <Layers className="w-3.5 h-3.5 text-purple-600" />
          <span>{c._count?.batches || 0} Batches</span>
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (c) => (
        <div className="flex items-center justify-end gap-1">
          {canEdit && (
            <button
              onClick={() => {
                setEditingCourse(c);
                setIsFormOpen(true);
              }}
              title="Edit Course"
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setDeletingId(c.id)}
              title="Delete Course"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <PageHeader
        title="Courses"
        badge={`${courses.length} Courses`}
        actions={
          canEdit && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => {
                setEditingCourse(null);
                setIsFormOpen(true);
              }}
            >
              Create New Course
            </Button>
          )
        }
      />

      {/* Main Course Table */}
      <DataTable
        data={courses}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search Courses"
        searchableFields={['name', 'targetExam', 'gradeLevel', 'courseId', 'description', 'subjects']}
        emptyTitle="No courses created yet"
        emptySubtitle="Get started on Day 1 by creating your first academic course."
        emptyAction={
          canEdit
            ? {
                label: '+ Create New Course',
                onClick: () => {
                  setEditingCourse(null);
                  setIsFormOpen(true);
                },
              }
            : undefined
        }
        isLoading={loading}
      />

      {/* Form Modal */}
      <CourseFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchCourses}
        initialCourse={editingCourse}
      />

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message="Are you sure you want to delete this course? Courses with enrolled students or active batches cannot be removed until batches are reassigned."
        isLoading={isDeleting}
      />
    </div>
  );
};
