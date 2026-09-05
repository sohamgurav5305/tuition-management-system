import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Faculty } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface FacultyWorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  faculty: Faculty | null;
}

export const FacultyWorkloadModal: React.FC<FacultyWorkloadModalProps> = ({
  isOpen,
  onClose,
  faculty,
}) => {
  const { formatCurrency } = useSettings();

  if (!faculty) return null;

  const batches = faculty.batches || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${faculty.firstName} ${faculty.lastName} - Workload Summary`}
      subtitle={`Faculty ID: ${faculty.facultyId} • ${faculty.subjectTaught}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <span className="text-xs text-blue-600 font-semibold">Assigned Batches</span>
            <p className="text-2xl font-black text-blue-900 mt-1">{batches.length}</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-xs text-emerald-600 font-semibold">Monthly Salary</span>
            <p className="text-2xl font-black text-emerald-900 mt-1">
              {formatCurrency(faculty.salary)}
            </p>
          </div>
        </div>

        {/* Batch Breakdown */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Assigned Batches & Schedule
          </h4>
          <div className="space-y-3">
            {batches.length > 0 ? (
              batches.map((b) => {
                let days: string[] = [];
                try {
                  days = typeof b.daysOfWeek === 'string' ? JSON.parse(b.daysOfWeek) : b.daysOfWeek;
                } catch {
                  days = [];
                }
                return (
                  <div
                    key={b.id}
                    className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{b.name}</h5>
                      <p className="text-slate-500 mt-0.5">{b.course?.name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {b.startTime} - {b.endTime}
                      </span>
                      <span className="font-bold text-blue-600">
                        {b._count?.students || 0} Students
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-xs text-slate-400 py-6">No batches currently assigned to this faculty.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl"
          >
            Close Summary
          </button>
        </div>
      </div>
    </Modal>
  );
};
