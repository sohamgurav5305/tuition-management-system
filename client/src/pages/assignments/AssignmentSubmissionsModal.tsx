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
  ExternalLink,
  Search,
  Paperclip,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { assignmentApi } from '../../services/api';
import { Assignment, AssignmentSubmission } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
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

  // Grading states
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
      fetchSubmissions();
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Submissions: ${assignment.title}`}
      subtitle={`Due: ${formatDate(assignment.dueDate)} • Max Score: ${assignment.totalMarks} pts`}
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Search & Summary Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or roll..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-600">
              Submitted: <strong className="text-blue-600">{submissions.length}</strong>
            </span>
            <span className="font-semibold text-slate-600">
              Graded: <strong className="text-emerald-600">{gradedCount}</strong>
            </span>
            <span className="font-semibold text-slate-600">
              Pending: <strong className="text-amber-600">{submissions.length - gradedCount}</strong>
            </span>
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading student submissions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200/60">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No Student Submissions Found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {submissions.length === 0
                ? 'No students from this batch have submitted their solutions yet.'
                : 'No submissions match your search query.'}
            </p>
          </div>
        ) : isAdmin ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 max-h-[55vh] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-center">Grade Status</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
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

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-mono font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">
                          {sub.student?.firstName} {sub.student?.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {sub.student?.studentId || ''}{' '}
                          {sub.student?.rollNumber ? `• Roll: ${sub.student.rollNumber}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700 font-mono text-xs">
                            {formattedDate}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              sub.isLate
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {sub.isLate ? 'Late' : 'On Time'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3" /> Graded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <AlertCircle className="w-3 h-3" /> Not Graded
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isGraded ? (
                          <span className="font-bold text-slate-900 tabular-nums">
                            {sub.score} / {assignment.totalMarks}{' '}
                            <span className="text-[11px] text-purple-600 font-bold">
                              ({pct}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {filtered.map((sub) => {
              const isGraded = sub.status === 'GRADED';
              const pct =
                isGraded && typeof sub.score === 'number'
                  ? Math.round((sub.score / assignment.totalMarks) * 100)
                  : null;

              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Student Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
                        {sub.student?.avatarUrl ? (
                          <img src={getMediaUrl(sub.student.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          `${sub.student?.firstName?.[0] || ''}${sub.student?.lastName?.[0] || ''}`
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          {sub.student?.firstName} {sub.student?.lastName}
                          {sub.student?.rollNumber && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-semibold">
                              {sub.student.rollNumber}
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400">{sub.student?.email}</p>
                      </div>
                    </div>

                    {/* Timing Badge & Grade Summary */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          sub.isLate
                            ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {sub.timingText || (sub.isLate ? 'Submitted Late' : 'Submitted On Time')}
                      </span>

                      {isGraded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                          <Award className="w-3.5 h-3.5" /> {sub.score} / {assignment.totalMarks} pts ({pct}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                          <AlertCircle className="w-3.5 h-3.5" /> Not Graded
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission Content & Solution Notes */}
                  {sub.submissionText && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                      <span className="font-bold text-slate-500 block mb-0.5">Student's Solution Notes:</span>
                      {sub.submissionText}
                    </div>
                  )}

                  {/* Feedback display */}
                  {isGraded && sub.feedback && (
                    <div className="p-3 bg-emerald-50/50 rounded-xl text-xs text-emerald-900 leading-relaxed border border-emerald-200/60">
                      <span className="font-bold text-emerald-700 block mb-0.5">
                        Faculty Feedback:
                      </span>
                      {sub.feedback}
                    </div>
                  )}

                  {/* Actions: View / Download Files + Grade Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {sub.files && sub.files.length > 0 ? (
                        sub.files.map((fUrl, fIdx) => {
                          const rawName = fUrl.split('/').pop()?.split('?')[0] || `Solution File #${fIdx + 1}`;
                          const cleanName = rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                          return (
                            <div
                              key={fIdx}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs font-semibold text-blue-900 shadow-2xs"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                              <span className="truncate max-w-[180px]" title={cleanName}>
                                {cleanName || `Solution File #${fIdx + 1}`}
                              </span>
                              <div className="flex items-center gap-1 ml-1 border-l border-blue-200 pl-1.5">
                                <a
                                  href={getMediaUrl(fUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100/80 rounded-md transition-colors flex items-center gap-1"
                                  title="View / Open File"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-bold">View</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => downloadMediaFile(fUrl, cleanName)}
                                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-100/80 rounded-md transition-colors"
                                  title="Download File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : sub.fileUrl ? (
                        (() => {
                          const rawName = sub.fileUrl.split('/').pop()?.split('?')[0] || 'Solution File';
                          const cleanName = rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                          return (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs font-semibold text-blue-900 shadow-2xs">
                              <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                              <span className="truncate max-w-[180px]" title={cleanName}>
                                {cleanName || 'Solution File'}
                              </span>
                              <div className="flex items-center gap-1 ml-1 border-l border-blue-200 pl-1.5">
                                <a
                                  href={getMediaUrl(sub.fileUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100/80 rounded-md transition-colors flex items-center gap-1"
                                  title="View / Open File"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-bold">View</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => downloadMediaFile(sub.fileUrl!, cleanName)}
                                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-100/80 rounded-md transition-colors"
                                  title="Download File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <span className="text-slate-400 text-[11px]">No file attached (text response only)</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenGrade(sub)}
                      className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                        isGraded
                          ? 'bg-slate-100 hover:bg-purple-50 hover:text-purple-600 text-slate-700'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-500/20'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      {isGraded ? 'Edit Marks & Feedback' : 'Grade Submission'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Inline Grading Submodal (Teacher only) */}
        {!isAdmin && gradingSubmission && (
          <div className="p-5 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-600" />
                Grading for {gradingSubmission.student?.firstName} {gradingSubmission.student?.lastName}
              </h4>
              <span className="text-xs text-slate-500 font-semibold">Max Marks: {assignment.totalMarks}</span>
            </div>

            <form onSubmit={handleSubmitGrade} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Marks Awarded *
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
                      className="w-full px-3 py-2 text-sm font-black bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      required
                    />
                    <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 font-bold">
                      / {assignment.totalMarks}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Faculty Remarks & Constructive Feedback (Optional)
                  </label>
                  <input
                    type="text"
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-3.5 py-1.5 bg-slate-200 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGrade}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingGrade ? 'Saving Grade...' : 'Save & Publish Grade'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl"
          >
            Close Submissions
          </button>
        </div>
      </div>
    </Modal>
  );
};
