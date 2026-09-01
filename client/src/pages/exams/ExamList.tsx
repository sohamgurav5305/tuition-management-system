import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, FileSpreadsheet, Calendar, Award, GraduationCap, Users } from 'lucide-react';
import { examApi } from '../../services/api';
import { Examination } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ExamFormModal } from './ExamFormModal';

export const ExamList: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { user } = useAuth();

  const [exams, setExams] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Examination | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMINISTRATOR';

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await examApi.getAll();
      setExams(res.data.data);
    } catch (err) {
      console.error('Failed to load exams', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await examApi.delete(deletingId);
      success('Exam Deleted', 'Examination record removed');
      fetchExams();
      setDeletingId(null);
    } catch (err: any) {
      error('Delete Failed', err.response?.data?.message || 'Could not delete exam');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Examination>[] = [
    {
      header: 'Exam Title & Pattern',
      cell: (e) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{e.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="primary" size="xs">
              {e.examPattern || 'JEE_MAIN'}
            </Badge>
            <span className="text-[11px] text-slate-400 font-mono">{e.examId}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Batch & Subject',
      cell: (e) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{e.batch?.name || 'All Batches'}</p>
          <p className="text-[11px] text-slate-400">{e.subject}</p>
        </div>
      ),
    },
    {
      header: 'Faculty Instructor',
      cell: (e) => {
        const fac = e.batch?.faculty;
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <GraduationCap className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
            <span>{fac ? `${fac.firstName} ${fac.lastName}` : 'Faculty Instructor'}</span>
          </div>
        );
      },
    },
    {
      header: 'Exam Date',
      cell: (e) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {e.examDate}
        </span>
      ),
    },
    {
      header: 'Scoring Schema',
      cell: (e) => (
        <div className="text-xs tabular-nums">
          <span className="font-bold text-slate-900 dark:text-slate-100">{e.totalMarks} Marks</span>
          <span className="text-[10px] text-slate-400 block">Pass: {e.passingMarks}</span>
        </div>
      ),
    },
    {
      header: 'Evaluations',
      cell: (e) => {
        const resultCount = e._count?.results || 0;
        return (
          <Badge variant={resultCount > 0 ? 'success' : 'warning'} size="xs" dot>
            {resultCount > 0 ? `${resultCount} Graded` : 'Pending Entry'}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (e) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => navigate(`/results?examId=${e.id}`)}
            title="Enter Student Marks"
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
          >
            <Award className="w-4 h-4" />
          </button>
          {(isTeacher || isAdmin) && (
            <button
              onClick={() => {
                setEditingExam(e);
                setIsFormOpen(true);
              }}
              title="Edit Test Config"
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setDeletingId(e.id)}
              title="Delete Exam"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
        title="Test Series & Examinations"
        subtitle="Schedule All-India mock test series, JEE/NEET patterns, grading matrices, negative marking deductions, and scorecards."
        badge={`${exams.length} Test Series`}
        actions={
          (isTeacher || isAdmin) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => {
                setEditingExam(null);
                setIsFormOpen(true);
              }}
            >
              Schedule New Exam
            </Button>
          )
        }
      />

      {/* Main Exam Table */}
      <DataTable
        data={exams}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchPlaceholder="Search exams by title, subject, pattern, exam ID..."
        searchableFields={['title', 'subject', 'examPattern', 'examId']}
        emptyTitle="No examinations scheduled yet"
        emptySubtitle="Schedule a mock test or minor examination to begin recording student scores and percentiles."
        emptyAction={
          isTeacher || isAdmin
            ? {
                label: '+ Schedule Exam',
                onClick: () => {
                  setEditingExam(null);
                  setIsFormOpen(true);
                },
              }
            : undefined
        }
        isLoading={loading}
      />

      {/* Form Modal */}
      <ExamFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchExams}
        initialExam={editingExam}
      />

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Examination"
        message="Are you sure you want to delete this examination? All student marks and scorecards associated with this exam will be permanently removed."
        isLoading={isDeleting}
      />
    </div>
  );
};
