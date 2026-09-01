import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  User,
  Layers,
  Check,
  X,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { leaveApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LeaveRequest } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const LeaveManagement: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Student Apply Form Modal
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStudent = user?.role === 'STUDENT';
  const canApprove = user?.role === 'ADMINISTRATOR' || user?.role === 'TEACHER';

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await leaveApi.getAll({
        status: statusFilter || undefined,
      });
      setLeaves(res.data.data);
    } catch (err) {
      console.error('Failed to load leaves', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      error('Required Fields', 'Please complete leave duration and reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      await leaveApi.apply({
        studentId: user?.id,
        startDate,
        endDate,
        reason,
      });
      success('Leave Application Submitted', 'Your leave request has been submitted for faculty review.');
      setIsApplyOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaves();
    } catch (err: any) {
      error('Submission Failed', err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await leaveApi.updateStatus(id, status);
      success(`Leave ${status}`, `Student leave application has been marked as ${status.toLowerCase()}.`);
      fetchLeaves();
    } catch (err: any) {
      error('Update Failed', err.message || 'Could not update leave status');
    }
  };

  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <PageHeader
        title={isStudent ? 'My Leave Applications' : 'Leave Requests & Approvals'}
        subtitle={
          isStudent
            ? 'Apply for planned leave of absence, track faculty approvals, and view application history.'
            : 'Review, approve, and track student absence applications and medical leave requests.'
        }
        badge={isStudent ? `${leaves.length} Applications` : `${pendingCount} Pending Review`}
        actions={
          isStudent ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => setIsApplyOpen(true)}
            >
              + Apply for Leave
            </Button>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { label: 'All Requests', value: '' },
          { label: 'Pending Review', value: 'PENDING' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Rejected', value: 'REJECTED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800/80'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaves List Table */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton count={4} />
          </div>
        ) : leaves.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            {isStudent ? (
              <div className="space-y-3">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p>You have not submitted any leave applications yet.</p>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={PlusCircle}
                  onClick={() => setIsApplyOpen(true)}
                >
                  Apply for Leave
                </Button>
              </div>
            ) : (
              'No leave requests found matching this status filter.'
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  {!isStudent && <th className="px-5 py-3">Student</th>}
                  <th className="px-5 py-3">Leave Duration</th>
                  <th className="px-5 py-3">Reason / Details</th>
                  <th className="px-5 py-3">Applied On</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  {!isStudent && <th className="px-5 py-3 text-right">Admin Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                    {!isStudent && (
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {l.student ? `${l.student.firstName} ${l.student.lastName}` : 'Enrolled Student'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {l.student?.studentId || '—'}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {l.startDate} &rarr; {l.endDate}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs text-slate-600 dark:text-slate-300">
                      <p className="line-clamp-2">{l.reason}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge
                        variant={
                          l.status === 'APPROVED'
                            ? 'success'
                            : l.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="xs"
                        dot
                      >
                        {l.status}
                      </Badge>
                    </td>
                    {!isStudent && (
                      <td className="px-5 py-3.5 text-right">
                        {l.status === 'PENDING' && canApprove ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStatusUpdate(l.id, 'APPROVED')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors border border-emerald-200/60 dark:border-emerald-800/60"
                              title="Approve Leave"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(l.id, 'REJECTED')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors border border-rose-200/60 dark:border-rose-800/60"
                              title="Reject Leave"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Reviewed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Apply Leave Modal */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Apply for Leave of Absence"
        maxWidth="md"
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Absence
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Medical illness, Family emergency, School examination..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsApplyOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
