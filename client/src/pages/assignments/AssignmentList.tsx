import React, { useEffect, useState } from 'react';
import { PlusCircle, Edit, Trash2, FileText, Download, Clock, Award, Users, BookOpen, Filter, GraduationCap, CheckCircle2, UserCheck } from 'lucide-react';
import { assignmentApi } from '../../services/api';
import { Assignment } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { AssignmentFormModal } from './AssignmentFormModal';
import { AssignmentSubmissionsModal } from './AssignmentSubmissionsModal';

export const AssignmentList: React.FC = () => {
  const { success, error } = useToast();
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingSubmissions, setViewingSubmissions] = useState<Assignment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMINISTRATOR';

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await assignmentApi.getAll();
      setAssignments(res.data.data);
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await assignmentApi.delete(deletingId);
      success('Assignment Removed', 'Assignment deleted successfully');
      fetchAssignments();
      setDeletingId(null);
    } catch (err: any) {
      error('Delete Failed', err.response?.data?.message || 'Could not delete assignment');
    } finally {
      setIsDeleting(false);
    }
  };

  const allSubjects = Array.from(new Set(assignments.map((a) => a.subject).filter(Boolean)));

  const filteredAssignments = subjectFilter
    ? assignments.filter((a) => a.subject === subjectFilter)
    : assignments;

  const columns: Column<Assignment>[] = [
    {
      header: 'Assignment Title',
      cell: (a) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{a.title}</p>
          <span className="text-[11px] text-slate-400 font-mono">{a.assignmentId}</span>
        </div>
      ),
    },
    {
      header: 'Subject & Batch',
      cell: (a) => (
        <div className="space-y-1">
          <Badge variant="primary" size="xs">
            {a.subject}
          </Badge>
          <p className="text-[11px] text-slate-500 font-medium">{a.batch?.name || 'All Batches'}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Faculty',
      cell: (a) => {
        const facName = a.faculty
          ? `${a.faculty.firstName} ${a.faculty.lastName}`
          : a.batch?.faculty
          ? `${a.batch.faculty.firstName} ${a.batch.faculty.lastName}`
          : 'Faculty Instructor';
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <GraduationCap className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
            <span>{facName}</span>
          </div>
        );
      },
    },
    {
      header: 'Submission Deadline',
      cell: (a) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> {a.dueDate}
        </span>
      ),
    },
    {
      header: 'Max Score',
      cell: (a) => (
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
          {a.totalMarks} pts
        </span>
      ),
    },
    {
      header: 'Submissions & Progress',
      cell: (a) => {
        const subCount = (a as any)._count?.submissions ?? (a as any).submissions?.length ?? 0;
        const studentCount = a.batch?._count?.students ?? 0;
        return (
          <button
            onClick={() => setViewingSubmissions(a)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-xs font-semibold border border-slate-200/60 dark:border-slate-700 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>
              {subCount} / {studentCount > 0 ? studentCount : '—'} Submitted
            </span>
          </button>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (a) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewingSubmissions(a)}
            title="Review Submissions"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
          >
            <Users className="w-4 h-4" />
          </button>
          {(isTeacher || isAdmin) && (
            <>
              <button
                onClick={() => {
                  setEditingAssignment(a);
                  setIsFormOpen(true);
                }}
                title="Edit Assignment"
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeletingId(a.id)}
                title="Delete Assignment"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
        title="Assignments & Coursework"
        subtitle="Manage subject problem sets, daily homework sheets, deadline trackers, and faculty evaluation."
        badge={`${assignments.length} Coursework Sets`}
        actions={
          isTeacher && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => {
                setEditingAssignment(null);
                setIsFormOpen(true);
              }}
            >
              Create Assignment
            </Button>
          )
        }
      />

      {/* Subject Filter Bar */}
      {allSubjects.length > 0 && (
        <div className="p-3.5 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500 uppercase tracking-wider">Filter Subject:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
            >
              <option value="">All Subjects</option>
              {allSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {subjectFilter && (
              <button
                onClick={() => setSubjectFilter('')}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <span className="text-slate-400 font-mono">
            {filteredAssignments.length} of {assignments.length} sets
          </span>
        </div>
      )}

      {/* Main Table */}
      <DataTable
        data={filteredAssignments}
        columns={columns}
        keyExtractor={(a) => a.id}
        searchPlaceholder="Search assignments by title, subject, batch..."
        searchableFields={['title', 'assignmentId', 'subject']}
        emptyTitle="No coursework posted yet"
        emptySubtitle="Faculty can post daily practice assignments and problem sets for assigned batches."
        emptyAction={
          isTeacher
            ? {
                label: '+ Create Assignment',
                onClick: () => {
                  setEditingAssignment(null);
                  setIsFormOpen(true);
                },
              }
            : undefined
        }
        isLoading={loading}
      />

      {/* Form Modal */}
      <AssignmentFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAssignment(null);
        }}
        onSuccess={fetchAssignments}
        initialAssignment={editingAssignment}
      />

      {/* Submissions Modal */}
      <AssignmentSubmissionsModal
        isOpen={!!viewingSubmissions}
        onClose={() => setViewingSubmissions(null)}
        assignment={viewingSubmissions}
        onGraded={fetchAssignments}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? All student submissions and grading records will be permanently removed."
        isLoading={isDeleting}
      />
    </div>
  );
};
