import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  User,
  GraduationCap,
  Briefcase,
  Layers,
  Check,
  X,
  PlusCircle,
  FileText,
  Search,
  ShieldCheck,
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
import { formatDate } from '../../utils/date';

export const LeaveManagement: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [applicantTypeFilter, setApplicantTypeFilter] = useState<string>('ALL'); // 'ALL' | 'STUDENT' | 'FACULTY'
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Apply Leave Modal State (For Students and Faculty)
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStudent = user?.role === 'STUDENT';
  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMINISTRATOR';

  const fetchLeaves = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await leaveApi.getAll({
        status: statusFilter || undefined,
      });
      setLeaves(res.data.data || []);
    } catch (err) {
      console.error('Failed to load leaves', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves(true);
    const interval = setInterval(() => {
      fetchLeaves(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      error('Required Fields', 'Please complete leave duration and reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isTeacher) {
        // Faculty Leave Application (Admin Approval Required)
        await leaveApi.apply({
          startDate,
          endDate,
          reason,
          applicantType: 'FACULTY',
        });
        success(
          'Faculty Leave Submitted',
          'Your leave application has been submitted directly to the Administrator for review.'
        );
      } else {
        // Student Leave Application
        await leaveApi.apply({
          startDate,
          endDate,
          reason,
          applicantType: 'STUDENT',
        });
        success(
          'Leave Application Submitted',
          'Your leave request has been submitted for faculty and admin review.'
        );
      }

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
      success(`Leave ${status}`, `Leave application has been marked as ${status.toLowerCase()}.`);
      fetchLeaves();
    } catch (err: any) {
      error('Update Failed', err.response?.data?.message || err.message || 'Could not update leave status');
    }
  };

  // Filter leaves based on type and search query
  const filteredLeaves = leaves.filter((l) => {
    // 1. Applicant Type Filter
    if (applicantTypeFilter === 'STUDENT' && l.applicantType === 'FACULTY') return false;
    if (applicantTypeFilter === 'FACULTY' && l.applicantType !== 'FACULTY') return false;

    // 2. Search Query
    if (searchQuery.trim()) {
      const words = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) return true;

      const studentName = l.student ? `${l.student.firstName} ${l.student.lastName}` : '';
      const facultyName = l.faculty ? `${l.faculty.firstName} ${l.faculty.lastName}` : '';
      const reasonText = l.reason || '';
      const idCode = l.student?.studentId || l.faculty?.facultyId || '';
      const subject = l.faculty?.subjectTaught || '';
      const combined = `${studentName} ${facultyName} ${reasonText} ${idCode} ${subject}`.toLowerCase();

      return words.every((word) => combined.includes(word));
    }

    return true;
  });

  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;
  const facultyLeavesCount = leaves.filter((l) => l.applicantType === 'FACULTY').length;
  const studentLeavesCount = leaves.filter((l) => l.applicantType !== 'FACULTY').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <PageHeader
        title={
          isStudent
            ? 'My Leave Applications'
            : isTeacher
            ? 'Student Requests & My Leaves'
            : 'Leave Requests & Approvals'
        }
        badge={
          isStudent
            ? undefined
            : `${pendingCount} Pending Review`
        }
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
          ) : isTeacher ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => setIsApplyOpen(true)}
            >
              + Ask a Leave
            </Button>
          ) : undefined
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leaves..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 font-medium"
            />
          </div>

          {/* Role / Applicant Category Dropdown (Admin & Teacher) */}
          {!isStudent && (
            <select
              value={applicantTypeFilter}
              onChange={(e) => setApplicantTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">All</option>
              <option value="STUDENT">Student Leaves</option>
              <option value="FACULTY">{isTeacher ? 'My Leaves' : 'Faculty Leaves'}</option>
            </select>
          )}

          {/* Status Category Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Leaves List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton count={4} />
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            {isStudent ? (
              <div className="space-y-3">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
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
            ) : isTeacher && applicantTypeFilter === 'FACULTY' ? (
              <div className="space-y-3">
                <Briefcase className="w-8 h-8 text-purple-300 mx-auto" />
                <p>You have not submitted any faculty leave applications yet.</p>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={PlusCircle}
                  onClick={() => setIsApplyOpen(true)}
                >
                  + Ask a Leave
                </Button>
              </div>
            ) : (
              'No leave requests found matching the current filters.'
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  {!isStudent && <th className="px-5 py-3">Applicant & Role</th>}
                  <th className="px-5 py-3">Leave Duration</th>
                  <th className="px-5 py-3">Reason / Details</th>
                  <th className="px-5 py-3">Applied On</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  {!isStudent && <th className="px-5 py-3 text-right">Approval Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaves.map((l) => {
                  const isFacultyLeave = l.applicantType === 'FACULTY' || Boolean(l.facultyId);
                  const isStudentLeave = !isFacultyLeave;

                  return (
                    <tr
                      key={l.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isFacultyLeave ? 'bg-purple-50/20' : ''
                      }`}
                    >
                      {/* Applicant Column (Only for Staff / Admins) */}
                      {!isStudent && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                isFacultyLeave
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {isFacultyLeave ? (
                                <Briefcase className="w-3.5 h-3.5" />
                              ) : (
                                <GraduationCap className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 block">
                                  {isFacultyLeave
                                    ? l.faculty
                                      ? `${l.faculty.firstName} ${l.faculty.lastName}`
                                      : 'Faculty Mentor'
                                    : l.student
                                    ? `${l.student.firstName} ${l.student.lastName}`
                                    : 'Enrolled Student'}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    isFacultyLeave
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {isFacultyLeave ? 'Faculty' : 'Student'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {isFacultyLeave
                                  ? `${l.faculty?.facultyId || 'FAC'} • ${l.faculty?.subjectTaught || 'Faculty'}`
                                  : `${l.student?.studentId || 'STU'}${l.student?.batch?.name ? ` • ${l.student.batch.name}` : ''}`}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Leave Duration */}
                      <td className="px-5 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {formatDate(l.startDate)} &rarr; {formatDate(l.endDate)}
                          </span>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-5 py-3.5 max-w-xs text-slate-600">
                        <p className="line-clamp-2">{l.reason}</p>
                      </td>

                      {/* Applied On */}
                      <td className="px-5 py-3.5 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                        {formatDate(l.createdAt)}
                      </td>

                      {/* Status */}
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

                      {/* Approval Actions */}
                      {!isStudent && (
                        <td className="px-5 py-3.5 text-right">
                          {l.status === 'PENDING' ? (
                            isFacultyLeave ? (
                              // FACULTY LEAVE: ONLY Administrator can approve/reject
                              isAdmin ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleStatusUpdate(l.id, 'APPROVED')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors border border-emerald-200/60"
                                    title="Approve Faculty Leave"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(l.id, 'REJECTED')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors border border-rose-200/60"
                                    title="Reject Faculty Leave"
                                  >
                                    <X className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                                  <Clock className="w-3 h-3" /> Awaiting Admin Approval
                                </span>
                              )
                            ) : (
                              // STUDENT LEAVE: Both Admin and Teacher can approve/reject
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleStatusUpdate(l.id, 'APPROVED')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors border border-emerald-200/60"
                                  title="Approve Student Leave"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(l.id, 'REJECTED')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors border border-rose-200/60"
                                  title="Reject Student Leave"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                              </div>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Reviewed by {l.reviewedBy || 'Staff'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leave Application Modal (Students & Faculty) */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title={isTeacher ? 'Ask a Leave' : 'Apply for Leave of Absence'}
        maxWidth="md"
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason for Absence
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isTeacher
                  ? ''
                  : ''
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
              {isTeacher ? 'Submit Leave Request to Admin' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
