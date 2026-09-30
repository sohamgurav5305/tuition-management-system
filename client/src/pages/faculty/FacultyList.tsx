import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, Layers, Briefcase, Award } from 'lucide-react';
import { facultyApi } from '../../services/api';
import { Faculty } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getMediaUrl } from '../../utils/media';
import { FacultyWorkloadModal } from './FacultyWorkloadModal';

export const FacultyList: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useSettings();
  const { success, error } = useToast();
  const { user } = useAuth();

  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [viewingWorkload, setViewingWorkload] = useState<Faculty | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = user?.role === 'ADMINISTRATOR';

  const fetchFaculty = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await facultyApi.getAll();
      setFacultyList(res.data.data);
    } catch (err) {
      console.error('Failed to load faculty list', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty(true);
    const interval = setInterval(() => {
      fetchFaculty(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await facultyApi.delete(deletingId);
      success('Faculty Removed', 'Faculty member removed successfully');
      fetchFaculty();
      setDeletingId(null);
    } catch (err: any) {
      error('Cannot Delete Faculty', err.response?.data?.message || 'Deletion failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Faculty>[] = [
    {
      header: 'Faculty Member',
      cell: (f) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold flex items-center justify-center text-xs overflow-hidden flex-shrink-0 relative">
            <span className="select-none">
              {f.firstName?.[0] || 'F'}{f.lastName?.[0] || ''}
            </span>
            {f.avatarUrl && (
              <img
                src={getMediaUrl(f.avatarUrl)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
          </div>
          <div className="min-w-0">
            <span
              onClick={() => setViewingWorkload(f)}
              className="font-bold text-slate-900 dark:text-slate-100 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer block truncate"
            >
              {f.firstName} {f.lastName}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{f.facultyId}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Subject Specialization',
      cell: (f) => (
        <div className="space-y-0.5">
          <Badge variant="purple" size="xs">{f.subjectTaught}</Badge>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs">{f.qualification}</p>
        </div>
      ),
    },
    {
      header: 'Contact & Login Email',
      cell: (f) => (
        <div className="text-xs">
          <p className="text-slate-700 dark:text-slate-300 font-medium">{f.phone}</p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-mono truncate max-w-[200px]" title={f.email}>
            {f.email}
          </p>
        </div>
      ),
    },
    {
      header: 'Workload & Batches',
      cell: (f) => (
        <button
          onClick={() => setViewingWorkload(f)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-purple-950/40 text-slate-700 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-300 rounded-lg text-xs font-semibold border border-slate-200/60 dark:border-slate-700 transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{f.batchCount ?? f._count?.batches ?? 0} Batches</span>
        </button>
      ),
    },
    {
      header: 'Monthly Compensation',
      cell: (f) => (
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
          {formatCurrency(f.salary)}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (f) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewingWorkload(f)}
            title="Workload Summary"
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
          >
            <Briefcase className="w-4 h-4" />
          </button>
          {canEdit && (
            <>
              <button
                onClick={() => navigate('/faculty/edit/' + f.id)}
                title="Edit Faculty Record"
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeletingId(f.id)}
                title="Remove Faculty Member"
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
        title="Faculty"
        actions={
          canEdit && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => navigate('/faculty/new')}
            >
              Add New Faculty
            </Button>
          )
        }
      />

      {/* Main Faculty Table */}
      <DataTable
        data={facultyList}
        columns={columns}
        keyExtractor={(f) => f.id}
        searchPlaceholder="Search Faculty"
        searchableFields={['firstName', 'lastName', 'facultyId', 'subjectTaught', 'email', 'phone', 'qualification', 'batches']}
        isLoading={loading}
      />

      {/* Workload Modal */}
      {viewingWorkload && (
        <FacultyWorkloadModal
          isOpen={!!viewingWorkload}
          onClose={() => setViewingWorkload(null)}
          faculty={viewingWorkload}
        />
      )}

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Faculty"
        message="Are you sure you want to delete this faculty member? Faculty currently assigned to active batches cannot be removed until batches are reassigned."
        isLoading={isDeleting}
      />
    </div>
  );
};
