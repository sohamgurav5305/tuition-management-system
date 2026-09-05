import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Eye, Edit, Trash2, Filter, Download, CreditCard, Users, UserPlus } from 'lucide-react';
import { studentApi, courseApi, batchApi, reportApi } from '../../services/api';
import { Student, Course, Batch } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getMediaUrl } from '../../utils/media';
import { StudentFormModal } from './StudentFormModal';

export const StudentList: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useSettings();
  const { success, error } = useToast();
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMINISTRATOR';
  const isAccountant = user?.role === 'ACCOUNTANT';
  const isTeacher = user?.role === 'TEACHER';

  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState<string>('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStudents = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await studentApi.getAll({
        batchId: selectedBatch || undefined,
        status: selectedStatus || undefined,
        feeStatus: selectedFeeStatus || undefined,
      });
      setStudents(res.data.data);
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [crsRes, batRes] = await Promise.all([
          courseApi.getAll(),
          batchApi.getAll({ status: 'ACTIVE' }),
        ]);
        setCourses(crsRes.data.data);
        setBatches(batRes.data.data);
      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    };
    loadFilterOptions();
  }, []);

  useEffect(() => {
    fetchStudents(true);
    const interval = setInterval(() => {
      fetchStudents(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedBatch, selectedStatus, selectedFeeStatus]);

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await studentApi.delete(deletingId);
      success('Student Deleted', 'Student record removed successfully.');
      fetchStudents();
      setDeletingId(null);
    } catch (err: any) {
      error('Delete Failed', err.response?.data?.message || 'Could not delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Student>[] = [
    {
      header: 'Student Name',
      cell: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
            {s.avatarUrl ? (
              <img src={getMediaUrl(s.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              `${s.firstName?.[0] || 'S'}${s.lastName?.[0] || ''}`
            )}
          </div>
          <div className="min-w-0">
            <span
              onClick={() => navigate(`/students/${s.id}`)}
              className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer block truncate"
            >
              {s.firstName} {s.lastName}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">{s.studentId}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Batch',
      cell: (s) => (
        <div className="text-xs">
          {s.batch ? (
            <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
              {s.batch.name}
            </span>
          ) : (
            <span className="text-slate-400 italic">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      header: 'Contact',
      cell: (s) => (
        <div className="text-xs">
          <span className="text-slate-800 block font-medium">{s.phone}</span>
          <span className="text-[11px] text-slate-400 truncate block max-w-[150px]">{s.email}</span>
        </div>
      ),
    },
    ...(!isAccountant
      ? [
          {
            header: 'Attendance',
            cell: (s: Student) => {
              const rate = s.attendancePercentage ?? s.attendanceStats?.percentage ?? 0;
              return (
                <div className="w-24 space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span>{rate}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${rate}%` }}
                      className={`h-full rounded-full ${
                        rate >= 85 ? 'bg-emerald-500' : rate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              );
            },
          },
        ]
      : []),
    ...(!isTeacher
      ? [
          {
            header: 'Fee Status',
            cell: (s: Student) => {
              const isPaid = s.pendingFee === 0 && s.paidFee > 0;
              const isPartial = s.paidFee > 0 && s.pendingFee > 0;
              return (
                <div className="space-y-0.5">
                  <Badge variant={isPaid ? 'success' : isPartial ? 'warning' : 'danger'} size="xs" dot>
                    {isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'PENDING'}
                  </Badge>
                  {s.pendingFee > 0 && (
                    <span className="text-[10px] text-rose-600 font-mono block">
                      Due: {formatCurrency(s.pendingFee)}
                    </span>
                  )}
                </div>
              );
            },
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            header: 'Status',
            cell: (s: Student) => (
              <Badge variant={s.status === 'ACTIVE' ? 'success' : 'neutral'} size="xs">
                {s.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            ),
          },
        ]
      : []),
    {
      header: 'Actions',
      cell: (s) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/students/${s.id}`)}
            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
            title="View Full Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setEditingStudent(s);
                  setIsFormOpen(true);
                }}
                className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                title="Edit Record"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeletingId(s.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                title="Delete Student"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const sortedStudents = React.useMemo(() => {
    return [...students].sort((a, b) => {
      const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
      const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
      const cmp = nameA.localeCompare(nameB);
      if (cmp !== 0) return cmp;
      return (a.studentId || '').localeCompare(b.studentId || '');
    });
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <PageHeader
        title="Students"
        badge={`${students.length} Students`}
        actions={
          isAdmin ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={UserPlus}
              onClick={() => {
                setEditingStudent(null);
                setIsFormOpen(true);
              }}
            >
              + Add Student
            </Button>
          ) : undefined
        }
      />

      {/* Filter Toolbar & Data Table */}
      <DataTable
        columns={columns}
        data={sortedStudents}
        keyExtractor={(s: Student) => s.id}
        isLoading={loading}
        searchPlaceholder="Search student name, roll number, batch, phone..."
        searchableFields={['firstName', 'lastName', 'studentId', 'rollNumber', 'phone', 'email', 'guardianName', 'course', 'batch']}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            {/* Batch Filter */}
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Fee Status Filter */}
            {!isTeacher && (
              <select
                value={selectedFeeStatus}
                onChange={(e) => setSelectedFeeStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
              >
                <option value="">All Fee Statuses</option>
                <option value="PAID">Paid in Full</option>
                <option value="PARTIAL">Partial Dues</option>
                <option value="PENDING">Pending Dues</option>
              </select>
            )}

            {/* Enrollment Status Filter (Admin only) */}
            {isAdmin && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            )}
          </div>
        }
        emptyTitle="No Students Found"
        emptySubtitle="No student records match your active search and filter criteria."
      />

      {/* Add / Edit Student Modal */}
      <StudentFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingStudent(null);
        }}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingStudent(null);
          fetchStudents();
        }}
        initialStudent={editingStudent}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Student Record"
        message="Are you sure you want to delete this student? All attendance records and scorecards for this student will be permanently removed."
        confirmText="Delete Student"
        isLoading={isDeleting}
      />
    </div>
  );
};
