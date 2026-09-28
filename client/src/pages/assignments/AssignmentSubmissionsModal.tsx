import React, { useEffect, useState } from 'react';
import {
  FileText,
  Clock,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Award,
  Send,
  User,
  Search,
  Paperclip,
  ExternalLink,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { assignmentApi } from '../../services/api';
import { Assignment, AssignmentSubmission } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { FreeworkLoader } from '../../components/common/FreeworkLoader';
import { formatDate, formatDateTime } from '../../utils/date';
import { getMediaUrl, downloadMediaFile } from '../../utils/media';

interface AssignmentSubmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  onGraded?: () => void;
}

export const AssignmentSubmissionsModal: React.FC<AssignmentSubmissionsModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onGraded,
}) => {
  const { success, error } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMINISTRATOR';

  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Grading modal state
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [scoreInput, setScoreInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  const fetchSubmissions = async () => {
    if (!assignment) return;
    try {
      setLoading(true);
      const res = await assignmentApi.getSubmissions(assignment.id);
      setSubmissions(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && assignment) {
      fetchSubmissions();
    }
  }, [isOpen, assignment]);

  const handleOpenGrade = (sub: AssignmentSubmission) => {
    setGradingSubmission(sub);
    setScoreInput(sub.score !== null && sub.score !== undefined ? String(sub.score) : '');
    setFeedbackInput(sub.feedback || '');
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission || !assignment) return;

    const numScore = Number(scoreInput);
    if (isNaN(numScore) || numScore < 0 || numScore > assignment.totalMarks) {
      error('Invalid Marks', `Score must be a number between 0 and ${assignment.totalMarks}`);
      return;
    }

    setIsSubmittingGrade(true);
    try {
      await assignmentApi.gradeSubmission(gradingSubmission.id, {
        score: numScore,
        feedback: feedbackInput.trim() || undefined,
      });
      success('Grade Recorded', `Awarded ${numScore}/${assignment.totalMarks} marks to student`);
      setGradingSubmission(null);
      await fetchSubmissions();
      if (onGraded) onGraded();
    } catch (err: any) {
      error('Grading Failed', err.response?.data?.message || err.message);
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  if (!assignment) return null;

  const filtered = submissions.filter((s) => {
    if (!search.trim()) return true;
    const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return true;

    const combined = `${s.student?.firstName || ''} ${s.student?.lastName || ''} ${s.student?.rollNumber || ''} ${s.student?.studentId || ''} ${s.student?.email || ''}`.toLowerCase();
    return words.every((word) => combined.includes(word));
  });

  const gradedCount = submissions.filter((s) => s.status === 'GRADED').length;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Submissions: ${assignment.title}`}
        subtitle={`Due: ${formatDate(assignment.dueDate)} • Max Score: ${assignment.totalMarks} pts`}
        maxWidth="4xl"
      >
        <div className="space-y-4">
          {/* Search & Summary Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name or roll..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Submitted: <strong className="text-blue-600 dark:text-blue-400">{submissions.length}</strong>
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Graded: <strong className="text-emerald-600 dark:text-emerald-400">{gradedCount}</strong>
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Pending: <strong className="text-amber-600 dark:text-amber-400">{submissions.length - gradedCount}</strong>
              </span>
            </div>
          </div>

          {/* Submissions List in Row Format */}
          {loading ? (
            <FreeworkLoader
              label="Loading student submissions..."
              minHeight="min-h-[260px]"
              card={false}
              size="sm"
            />
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Student Submissions Found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {submissions.length === 0
                  ? 'No students from this batch have submitted their solutions yet.'
                  : 'No submissions match your search query.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 max-h-[58vh] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 dark:bg-slate-800/90 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">#</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Timeline</th>
                    <th className="py-3 px-4">Solution Files</th>
                    <th className="py-3 px-4">Score & Status</th>
                    {!isAdmin && <th className="py-3 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((sub, idx) => {
                    const isGraded = sub.status === 'GRADED';
                    const pct =
                      isGraded && typeof sub.score === 'number'
                        ? Math.round((sub.score / assignment.totalMarks) * 100)
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
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Index */}
                        <td className="py-3.5 px-4 text-center text-slate-400 dark:text-slate-500 font-mono font-bold">
                          {idx + 1}
                        </td>

                        {/* Student Name */}
                        <td className="py-3.5 px-4">
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
                        <td className="py-3.5 px-4 whitespace-nowrap">
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

                        {/* Solution Files & Notes */}
                        <td className="py-3.5 px-4">
                          {fileList.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-w-xs">
                              {fileList.map((url, fIdx) => {
                                const rawName =
                                  url.split('/').pop()?.split('?')[0] || `File #${fIdx + 1}`;
                                const cleanName =
                                  rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                                return (
                                  <div
                                    key={fIdx}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 rounded-xl text-[11px] font-semibold text-blue-900 dark:text-blue-200"
                                  >
                                    <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <span className="truncate max-w-[110px]" title={cleanName}>
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
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isGraded ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums text-xs block">
                                {sub.score} / {assignment.totalMarks} pts{' '}
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
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
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

          <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Submissions
            </Button>
          </div>
        </div>
      </Modal>

      {/* Grading Modal */}
      {gradingSubmission && (
        <Modal
          isOpen={!!gradingSubmission}
          onClose={() => setGradingSubmission(null)}
          title={`Grade: ${gradingSubmission.student?.firstName} ${gradingSubmission.student?.lastName}`}
          subtitle={`Max Marks: ${assignment.totalMarks}`}
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
                Marks Awarded (out of {assignment.totalMarks}) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={assignment.totalMarks}
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  placeholder={`0 - ${assignment.totalMarks}`}
                  className="w-full px-3 py-2 text-sm font-black bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-900 dark:text-slate-100"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                  / {assignment.totalMarks} pts
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
    </>
  );
};
