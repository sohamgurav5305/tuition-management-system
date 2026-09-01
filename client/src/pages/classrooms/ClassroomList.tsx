import React, { useEffect, useState } from 'react';
import { Building2, PlusCircle, Edit, Trash2, Users, MapPin, CheckCircle2, AlertTriangle, Sparkles, Filter, Layers } from 'lucide-react';
import { classroomApi } from '../../services/api';
import { Classroom } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { ClassroomFormModal } from './ClassroomFormModal';

export const ClassroomList: React.FC = () => {
  const { success, error } = useToast();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const res = await classroomApi.getAll();
      setClassrooms(res.data.data);
    } catch (err) {
      console.error('Failed to load classrooms', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await classroomApi.delete(deletingId);
      success('Classroom Removed', 'Venue deleted from institute registry');
      fetchClassrooms();
      setDeletingId(null);
    } catch (err: any) {
      error('Delete Failed', err.response?.data?.message || 'Could not delete classroom');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredClassrooms = typeFilter
    ? classrooms.filter((c) => c.roomType === typeFilter)
    : classrooms;

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'LECTURE_HALL':
        return 'Lecture Hall';
      case 'SMART_CLASS':
        return 'Smart Classroom';
      case 'SCIENCE_LAB':
        return 'Science Lab';
      case 'COMPUTER_LAB':
        return 'Computer Lab';
      case 'AUDITORIUM':
        return 'Auditorium';
      default:
        return type;
    }
  };

  const columns: Column<Classroom>[] = [
    {
      header: 'Classroom / Venue',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
              {c.name}
            </p>
            <span className="text-[11px] text-slate-400 font-mono">{c.roomId}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Classification',
      cell: (c) => (
        <Badge variant="primary" size="xs">
          {getRoomTypeLabel(c.roomType)}
        </Badge>
      ),
    },
    {
      header: 'Seating Capacity',
      cell: (c) => (
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{c.capacity} Desks</span>
        </div>
      ),
    },
    {
      header: 'Location / Wing',
      cell: (c) => (
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
          <span className="truncate max-w-xs">{c.building}</span>
        </div>
      ),
    },
    {
      header: 'Facilities Installed',
      cell: (c) => (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate" title={c.facilities || 'Standard lecture setup'}>
          {c.facilities || 'Standard lecture setup'}
        </p>
      ),
    },
    {
      header: 'Status',
      cell: (c) => (
        <Badge
          variant={c.status === 'AVAILABLE' ? 'success' : c.status === 'OCCUPIED' ? 'warning' : 'danger'}
          size="xs"
          dot
        >
          {c.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (c) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditingClassroom(c);
              setIsFormOpen(true);
            }}
            title="Edit Classroom"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingId(c.id)}
            title="Delete Classroom"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <PageHeader
        title="Classrooms & Lecture Venues"
        subtitle="Manage institute infrastructure, lecture hall capacities, smart screens, and venue availability for batch allocation."
        badge={`${classrooms.length} Venues`}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={PlusCircle}
            onClick={() => {
              setEditingClassroom(null);
              setIsFormOpen(true);
            }}
          >
            Add Classroom Venue
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { label: 'All Venues', value: '' },
          { label: 'Lecture Halls', value: 'LECTURE_HALL' },
          { label: 'Smart Classrooms', value: 'SMART_CLASS' },
          { label: 'Science Labs', value: 'SCIENCE_LAB' },
          { label: 'Auditoriums', value: 'AUDITORIUM' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTypeFilter(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              typeFilter === tab.value
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800/80'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Classroom Table */}
      <DataTable
        data={filteredClassrooms}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search classrooms by name, building, facilities, room ID..."
        searchableFields={['name', 'building', 'facilities', 'roomId', 'roomType']}
        isLoading={loading}
      />

      {/* Form Modal */}
      <ClassroomFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchClassrooms}
        initialClassroom={editingClassroom}
      />

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Remove Classroom Venue"
        message="Are you sure you want to remove this classroom from the institute registry? Batches currently assigned to this room will need to be reallocated."
        isLoading={isDeleting}
      />
    </div>
  );
};
