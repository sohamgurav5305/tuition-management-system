import React, { useEffect, useState } from 'react';
import { PlusCircle, Edit, Trash2, Users, Clock, MapPin, Calendar, Layers, Filter } from 'lucide-react';
import { batchApi, courseApi } from '../../services/api';
import { Batch, Course } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { BatchFormModal } from './BatchFormModal';
import { BatchDetailModal } from './BatchDetailModal';

export const BatchList: React.FC = () => {
  const { success, error } = useToast();
  const { user } = useAuth();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [viewingBatch, setViewingBatch] = useState<Batch | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = user?.role === 'ADMINISTRATOR';
  const canDelete = user?.role === 'ADMINISTRATOR';

  const fetchBatches = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await batchApi.getAll({ courseId: selectedCourse || undefined });
      setBatches(res.data.data);
    } catch (err) {
      console.error('Failed to load batches', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await courseApi.getAll();
        setCourses(res.data.data);
      } catch (err) {
        console.error('Failed to load courses', err);
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    fetchBatches(true);
    const interval = setInterval(() => {
      fetchBatches(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedCourse]);

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await batchApi.delete(deletingId);
      success('Batch Deleted', 'Batch class group removed from system');
      fetchBatches();
      setDeletingId(null);
    } catch (err: any) {
      error('Delete Failed', err.response?.data?.message || 'Cannot delete batch with enrolled students');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDetail = async (b: Batch) => {
    try {
      const res = await batchApi.getById(b.id);
      setViewingBatch(res.data.data);
    } catch {
      setViewingBatch(b);
    }
  };

  const columns: Column<Batch>[] = [
    {
      header: 'Batch',
      cell: (b) => (
        <div>
          <span
            onClick={() => handleOpenDetail(b)}
            className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer block text-xs sm:text-sm truncate"
          >
            {b.name}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{b.batchId}</span>
        </div>
      ),
    },
    {
      header: 'Course',
      cell: (b) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {b.course?.name}
        </span>
      ),
    },
    {
      header: 'Assigned Instructors',
      cell: (b) => {
        const instructors = b.subjectInstructors && b.subjectInstructors.length > 0
          ? b.subjectInstructors
          : b.faculty
          ? [{ subject: b.faculty.subjectTaught, facultyName: `${b.faculty.firstName} ${b.faculty.lastName}` }]
          : [];

        if (instructors.length === 0) {
          return <span className="text-xs text-slate-400 dark:text-slate-500">Unassigned</span>;
        }

        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {instructors.map((inst, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-semibold border border-purple-200/60 dark:border-purple-800"
                title={`${inst.subject}: ${inst.facultyName}`}
              >
                <span className="font-bold">{inst.subject}:</span> {inst.facultyName}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Class Schedule',
      cell: (b) => {
        let days: string[] = [];
        try {
          days = typeof b.daysOfWeek === 'string' ? JSON.parse(b.daysOfWeek) : b.daysOfWeek;
        } catch {
          days = [];
        }
        return (
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {b.startTime} - {b.endTime}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">{days.join(', ')}</p>
          </div>
        );
      },
    },
    {
      header: 'Enrollment',
      cell: (b) => {
        const enrolled = b._count?.students || 0;
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{enrolled} Students</span>
          </span>
        );
      },
    },
    {
      header: 'Details',
      className: 'text-right',
      cell: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetail(b);
            }}
            title="View Batch Details & Enrolled Students"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
          {canEdit && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingBatch(b);
                  setIsFormOpen(true);
                }}
                title="Edit Batch"
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingId(b.id);
                }}
                title="Delete Batch"
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <PageHeader
        title={user?.role === 'TEACHER' ? 'My Assigned Batches' : 'Batches'}
        actions={
          canEdit && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => {
                setEditingBatch(null);
                setIsFormOpen(true);
              }}
            >
              Create Batch
            </Button>
          )
        }
      />

      {/* Main Batch Table */}
      <DataTable
        data={batches}
        columns={columns}
        keyExtractor={(b) => b.id}
        onRowClick={(b) => handleOpenDetail(b)}
        searchPlaceholder="Search Batches"
        searchableFields={['name', 'batchId', 'course', 'faculty', 'subjectTeachers']}
        filters={
          courses.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Course:
              </span>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : undefined
        }
        emptyTitle="No batches created yet"
        emptySubtitle="Create your first batch and assign faculty."
        emptyAction={
          canEdit
            ? {
                label: '+ Create Batch',
                onClick: () => {
                  setEditingBatch(null);
                  setIsFormOpen(true);
                },
              }
            : undefined
        }
        isLoading={loading}
      />

      {/* Form Modal */}
      <BatchFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchBatches}
        initialBatch={editingBatch}
      />

      {/* Detail Modal */}
      {viewingBatch && (
        <BatchDetailModal
          isOpen={!!viewingBatch}
          onClose={() => setViewingBatch(null)}
          batch={viewingBatch}
        />
      )}

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Batch"
        message="Are you sure you want to delete this batch? All assigned student enrollments must be moved prior to deletion."
        isLoading={isDeleting}
      />
    </div>
  );
};
