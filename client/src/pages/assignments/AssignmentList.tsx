import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PlusCircle,
  Edit,
  Trash2,
  FileText,
  Download,
  Clock,
  Award,
  Users,
  BookOpen,
  Filter,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowLeft,
  Search,
  Paperclip,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { assignmentApi } from '../../services/api';
import { Assignment, AssignmentSubmission } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime } from '../../utils/date';
import { getMediaUrl, downloadMediaFile } from '../../utils/media';
import { AssignmentFormView } from './AssignmentFormView';
import { AssignmentSubmissionsModal } from './AssignmentSubmissionsModal';

export const AssignmentList: React.FC = () => {
  const { success, error } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAssignmentId = searchParams.get('id');

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingSubmissionsModal, setViewingSubmissionsModal] = useState<Assignment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dedicated Detail View Submissions
  const [detailSubmissions, setDetailSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loadingDetailSubmissions, setLoadingDetailSubmissions] = useState(false);
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<'ALL' | 'GRADED' | 'PENDING'>('ALL');
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [scoreInput, setScoreInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMINISTRATOR';

  const fetchAssignments = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await assignmentApi.getAll();
      setAssignments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchDetailSubmissions = async (id: string) => {
    try {
      setLoadingDetailSubmissions(true);
      const res = await assignmentApi.getSubmissions(id);
      setDetailSubmissions(res.data.data || []);
    } catch (err) {
      console.error('Failed to load assignment submissions', err);
    } finally {
      setLoadingDetailSubmissions(false);
    }
  };

  useEffect(() => {
    fetchAssignments(true);
    const interval = setInterval(() => {
      fetchAssignments(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedAssignmentId) {
      fetchDetailSubmissions(selectedAssignmentId);
      setSubmissionStatusFilter('ALL');
      setSubmissionSearch('');
    }
  }, [selectedAssignmentId]);

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await assignmentApi.delete(deletingId);
      success('Assignment Removed', 'Assignment deleted successfully');
      if (selectedAssignmentId === deletingId) {
        setSearchParams({});
      }
      fetchAssignments();
      setDeletingId(null);
    } catch (err: any) {
      error('Delete Failed', err.response?.data?.message || 'Could not delete assignment');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenGrade = (sub: AssignmentSubmission) => {
    setGradingSubmission(sub);
    setScoreInput(sub.score !== null && sub.score !== undefined ? String(sub.score) : '');
    setFeedbackInput(sub.feedback || '');
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission || !selectedAssignment) return;

    const numScore = Number(scoreInput);
    if (isNaN(numScore) || numScore < 0 || numScore > selectedAssignment.totalMarks) {
      error('Invalid Marks', `Score must be a number between 0 and ${selectedAssignment.totalMarks}`);
      return;
    }

    setIsSubmittingGrade(true);
    try {
      await assignmentApi.gradeSubmission(gradingSubmission.id, {
        score: numScore,
        feedback: feedbackInput.trim() || undefined,
      });
      success('Grade Recorded', `Awarded ${numScore}/${selectedAssignment.totalMarks} marks to student`);
      setGradingSubmission(null);
      if (selectedAssignmentId) {
        await fetchDetailSubmissions(selectedAssignmentId);
      }
      fetchAssignments();
    } catch (err: any) {
      error('Grading Failed', err.response?.data?.message || err.message);
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const allSubjects = Array.from(new Set(assignments.map((a) => a.subject).filter(Boolean)));

  const filteredAssignments = subjectFilter
    ? assignments.filter((a) => a.subject === subjectFilter)
    : assignments;

  const selectedAssignment = selectedAssignmentId
    ? assignments.find((a) => a.id === selectedAssignmentId)
    : null;

  // -------------------------------------------------------------
  // VIEW 3: DEDICATED FULL ASSIGNMENT CREATE / EDIT VIEW
  // -------------------------------------------------------------
  if (isFormOpen) {
    return (
      <AssignmentFormView
        initialAssignment={editingAssignment}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAssignment(null);
        }}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingAssignment(null);
          fetchAssignments(true);
          if (selectedAssignmentId) {
            fetchDetailSubmissions(selectedAssignmentId);
          }
        }}
      />
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: DEDICATED FULL ASSIGNMENT DETAILS & SUBMISSIONS VIEW
  // -------------------------------------------------------------
  if (selectedAssignment) {
    const questionMaterials =
      selectedAssignment.attachments && selectedAssignment.attachments.length > 0
        ? selectedAssignment.attachments
        : selectedAssignment.attachmentUrl
        ? [selectedAssignment.attachmentUrl]
        : [];

    const filteredSubmissions = detailSubmissions.filter((s) => {
      // Status Filter
      if (submissionStatusFilter === 'GRADED' && s.status !== 'GRADED') return false;
      if (submissionStatusFilter === 'PENDING' && s.status === 'GRADED') return false;

      // Search
      if (!submissionSearch.trim()) return true;
      const words = submissionSearch.toLowerCase().trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) return true;
      const combined = `${s.student?.firstName || ''} ${s.student?.lastName || ''} ${s.student?.rollNumber || ''} ${s.student?.studentId || ''} ${s.student?.email || ''}`.toLowerCase();
      return words.every((word) => combined.includes(word));
    });

    const gradedCount = detailSubmissions.filter((s) => s.status === 'GRADED').length;
    const pendingCount = detailSubmissions.length - gradedCount;
    const totalBatchStudents = selectedAssignment.batch?._count?.students ?? (selectedAssignment as any)._count?.submissions ?? detailSubmissions.length;

    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => setSearchParams({})}
            className="self-start text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            Back to All Assignments
          </Button>

          {isTeacher && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={Edit}
                onClick={() => {
                  setEditingAssignment(selectedAssignment);
                  setIsFormOpen(true);
                }}
              >
                Edit Assignment
              </Button>
              <Button
                variant="danger"
                size="sm"
                leftIcon={Trash2}
                onClick={() => setDeletingId(selectedAssignment.id)}
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Assignment Hero / Overview Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                <BookOpen className="w-3.5 h-3.5" />
                {selectedAssignment.subject}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800">
                <Users className="w-3.5 h-3.5" />
                {selectedAssignment.batch?.name || 'All Batches'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Deadline: {formatDate(selectedAssignment.dueDate)}
              </span>
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 rounded-xl font-bold">
                Max: {selectedAssignment.totalMarks} pts
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {selectedAssignment.title}
            </h1>
            {selectedAssignment.faculty && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Instructor:{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedAssignment.faculty.firstName} {selectedAssignment.faculty.lastName}
                </span>
              </p>
            )}
          </div>

          {selectedAssignment.description && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Problem Description & Instructions:
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {selectedAssignment.description}
              </p>
            </div>
          )}

          {/* Instructor Problem Attachments */}
          {questionMaterials.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Assignment Question Attachments ({questionMaterials.length}):
              </span>
              <div className="flex flex-wrap gap-2.5">
                {questionMaterials.map((url, i) => {
                  const rawName =
                    url.split('/').pop()?.split('?')[0] || `Problem Sheet #${i + 1}`;
                  const cleanName =
                    rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                  return (
                    <div
                      key={i}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 rounded-2xl text-xs font-semibold text-blue-950 dark:text-blue-200 shadow-2xs"
                    >
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="truncate max-w-[200px]" title={cleanName}>
                        {cleanName}
                      </span>
                      <div className="flex items-center gap-1 ml-1 border-l border-blue-200 dark:border-blue-800 pl-2">
                        <a
                          href={getMediaUrl(url)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/60 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                          title="View Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadMediaFile(url, cleanName)}
                          className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/60 rounded-lg transition-colors"
                          title="Download Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Submissions Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Submitted Student Solutions
              </h2>
            </div>

            {/* Interactive Filter Pills */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSubmissionStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  submissionStatusFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                }`}
              >
                Submitted: {detailSubmissions.length}
              </button>
              <button
                type="button"
                onClick={() => setSubmissionStatusFilter('GRADED')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  submissionStatusFilter === 'GRADED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                }`}
              >
                Graded: {gradedCount}
              </button>
              <button
                type="button"
                onClick={() => setSubmissionStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  submissionStatusFilter === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                }`}
              >
                Pending: {pendingCount}
              </button>
            </div>
          </div>

          {/* Search Submissions Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={submissionSearch}
              onChange={(e) => setSubmissionSearch(e.target.value)}
              placeholder="Search by student name or roll..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          {/* Submissions Row Format Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            {loadingDetailSubmissions ? (
              <div className="p-8">
                <LoadingSkeleton count={4} />
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No Submissions Found
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {detailSubmissions.length === 0
                    ? 'No students from this batch have submitted their solutions yet.'
                    : 'No submissions match your search query.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 w-10 text-center">#</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Submission Time</th>
                      <th className="px-4 py-3">Attached Solution Files</th>
                      <th className="px-4 py-3">Score & Status</th>
                      {!isAdmin && <th className="px-4 py-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSubmissions.map((sub, idx) => {
                      const isGraded = sub.status === 'GRADED';
                      const pct =
                        isGraded && typeof sub.score === 'number'
                          ? Math.round((sub.score / selectedAssignment.totalMarks) * 100)
                          : null;
                      const formattedDate =
                        sub.submittedAt || (sub as any).createdAt
                          ? formatDateTime(sub.submittedAt || (sub as any).createdAt)
                          : sub.timingText || (sub.isLate ? 'Late' : 'On Time');

                      const fileList =
                        sub.files && sub.files.length > 0
                          ? sub.files
                          : sub.fileUrl
                          ? [sub.fileUrl]
                          : [];

                      return (
                        <tr
                          key={sub.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Index */}
                          <td className="px-4 py-3.5 text-center text-slate-400 dark:text-slate-500 font-mono font-bold">
                            {idx + 1}
                          </td>

                          {/* Student Name */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                {sub.student?.firstName?.[0] || 'S'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                  {sub.student?.firstName} {sub.student?.lastName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {sub.student?.studentId || ''}{' '}
                                  {sub.student?.rollNumber ? `• Roll: ${sub.student.rollNumber}` : ''}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Timeline */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px] block">
                                {formattedDate}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  sub.isLate
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                {sub.isLate ? 'Late' : 'On Time'}
                              </span>
                            </div>
                          </td>

                          {/* Solution Files */}
                          <td className="px-4 py-3.5">
                            {fileList.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {fileList.map((url, fIdx) => {
                                  const rawName =
                                    url.split('/').pop()?.split('?')[0] || `Solution #${fIdx + 1}`;
                                  const cleanName =
                                    rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                                  return (
                                    <div
                                      key={fIdx}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 rounded-xl text-[11px] font-semibold text-blue-900 dark:text-blue-200"
                                    >
                                      <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                      <span className="truncate max-w-[120px]" title={cleanName}>
                                        {cleanName}
                                      </span>
                                      <div className="flex items-center gap-1 ml-0.5 border-l border-blue-200 dark:border-blue-800 pl-1">
                                        <a
                                          href={getMediaUrl(url)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-0.5 text-blue-600 dark:text-blue-400 hover:text-blue-800"
                                          title="View"
                                        >
                                          <Eye className="w-3 h-3" />
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => downloadMediaFile(url, cleanName)}
                                          className="p-0.5 text-slate-500 hover:text-blue-600"
                                          title="Download"
                                        >
                                          <Download className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : sub.submissionText ? (
                              <span className="text-[11px] text-slate-600 dark:text-slate-400 italic truncate block max-w-xs" title={sub.submissionText}>
                                "{sub.submissionText}"
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">No file attached</span>
                            )}
                          </td>

                          {/* Score & Status */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {isGraded ? (
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums text-xs block">
                                  {sub.score} / {selectedAssignment.totalMarks} pts{' '}
                                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                                    ({pct}%)
                                  </span>
                                </span>
                                <Badge variant="success" size="xs" dot>
                                  Graded
                                </Badge>
                              </div>
                            ) : (
                              <Badge variant="warning" size="xs" dot>
                                Pending Grade
                              </Badge>
                            )}
                          </td>

                          {/* Action (Teacher) */}
                          {!isAdmin && (
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleOpenGrade(sub)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                  isGraded
                                    ? 'bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-600 text-slate-700 dark:text-slate-300'
                                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                                }`}
                              >
                                <Award className="w-3.5 h-3.5" />
                                {isGraded ? 'Edit Marks' : 'Grade'}
                              </button>
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
        </div>

        {/* Grading Modal */}
        {gradingSubmission && (
          <Modal
            isOpen={!!gradingSubmission}
            onClose={() => setGradingSubmission(null)}
            title={`Grade: ${gradingSubmission.student?.firstName} ${gradingSubmission.student?.lastName}`}
            subtitle={`Max Marks: ${selectedAssignment.totalMarks}`}
          >
            <form onSubmit={handleSubmitGrade} className="space-y-4">
              {gradingSubmission.submissionText && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200/80 dark:border-slate-700">
                  <span className="font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                    Student's Solution Notes:
                  </span>
                  {gradingSubmission.submissionText}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Marks Awarded (out of {selectedAssignment.totalMarks}) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={selectedAssignment.totalMarks}
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    placeholder={`0 - ${selectedAssignment.totalMarks}`}
                    className="w-full px-3 py-2 text-sm font-black bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-900 dark:text-slate-100"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                    / {selectedAssignment.totalMarks} pts
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Faculty Remarks & Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Add constructive remarks, point out error steps, or praise..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setGradingSubmission(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={Award}
                  isLoading={isSubmittingGrade}
                >
                  Save Grade
                </Button>
              </div>
            </form>
          </Modal>
        )}

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
  }

  // -------------------------------------------------------------
  // VIEW 1: MAIN ASSIGNMENT ROW-BY-ROW TABLE LIST
  // -------------------------------------------------------------
  const columns: Column<Assignment>[] = [
    {
      header: 'Assignment Title',
      cell: (a) => (
        <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-xs sm:text-sm transition-colors">
          {a.title}
        </p>
      ),
    },
    {
      header: 'Subject & Batch',
      cell: (a) => (
        <div className="space-y-1">
          <Badge variant="primary" size="xs">
            {a.subject}
          </Badge>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{a.batch?.name || 'All Batches'}</p>
        </div>
      ),
    },
    ...(!isTeacher
      ? [
          {
            header: 'Assigned Faculty',
            cell: (a: Assignment) => {
              const facName = a.faculty
                ? `${a.faculty.firstName} ${a.faculty.lastName}`
                : a.batch?.faculty
                ? `${a.batch.faculty.firstName} ${a.batch.faculty.lastName}`
                : 'Faculty Instructor';
              return (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span>{facName}</span>
                </div>
              );
            },
          },
        ]
      : []),
    {
      header: 'Submission Deadline',
      cell: (a) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> {formatDate(a.dueDate)}
        </span>
      ),
    },
    {
      header: 'Submissions',
      cell: (a) => {
        const subCount = (a as any)._count?.submissions ?? (a as any).submissions?.length ?? 0;
        const studentCount = a.batch?._count?.students ?? 0;
        return (
          <button
            onClick={() => setSearchParams({ id: a.id })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-300 rounded-lg text-xs font-semibold border border-slate-200/60 dark:border-slate-700 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>
              {subCount} / {studentCount > 0 ? studentCount : '—'} Submitted
            </span>
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <PageHeader
        title="Assignments"
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
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Filter Subject:
            </span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
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
        </div>
      )}

      {/* Main Table */}
      <DataTable
        data={filteredAssignments}
        columns={columns}
        keyExtractor={(a) => a.id}
        onRowClick={(a) => setSearchParams({ id: a.id })}
        searchPlaceholder="Search assignments by title, subject, batch, description..."
        searchableFields={['title', 'assignmentId', 'subject', 'description', 'batch', 'faculty']}
        emptyTitle="No Assignments posted yet"
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

      {/* Submissions Modal (fallback) */}
      <AssignmentSubmissionsModal
        isOpen={!!viewingSubmissionsModal}
        onClose={() => setViewingSubmissionsModal(null)}
        assignment={viewingSubmissionsModal}
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
