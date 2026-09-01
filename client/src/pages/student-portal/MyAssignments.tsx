import React, { useEffect, useState, useRef } from 'react';
import {
  FileText,
  Clock,
  Download,
  BookOpen,
  Upload,
  CheckCircle2,
  AlertCircle,
  Award,
  Send,
  Lock,
  Paperclip,
  Check,
  Filter,
} from 'lucide-react';
import { assignmentApi } from '../../services/api';
import { Assignment, AssignmentSubmission } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

export const MyAssignments: React.FC = () => {
  const { success, error } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  // Submission Modal state
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await assignmentApi.getMyAssignments();
      setAssignments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load my assignments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleOpenSubmit = (a: Assignment) => {
    setSubmittingAssignment(a);
    setSubmissionText(a.mySubmission?.submissionText || '');
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment) return;

    if (!selectedFile && !submissionText.trim()) {
      error('Input Required', 'Please upload a solution file or provide solution notes');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      if (submissionText.trim()) {
        formData.append('submissionText', submissionText.trim());
      }

      await assignmentApi.submit(submittingAssignment.id, formData);
      success(
        'Assignment Submitted!',
        'Your solution has been recorded with early/late timestamp and queued for faculty grading'
      );
      setSubmittingAssignment(null);
      setSelectedFile(null);
      setSubmissionText('');
      fetchAssignments();
    } catch (err: any) {
      error('Submission Failed', err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjects = Array.from(new Set(assignments.map((a) => a.subject).filter(Boolean)));

  const filtered =
    selectedSubject === 'ALL'
      ? assignments
      : assignments.filter((a) => a.subject === selectedSubject);

  if (loading && assignments.length === 0) return <LoadingSkeleton count={4} />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              My Academic Coursework & Problem Sets
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Lock className="w-3 h-3" /> Private Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Subject-wise problem sets, weekly homework submissions with automatic timing verification, and faculty gradecards.
          </p>
        </div>
      </div>

      {/* Subject Filter Bar */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter by Subject:
          </span>
          <button
            onClick={() => setSelectedSubject('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedSubject === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Subjects ({assignments.length})
          </button>
          {subjects.map((s) => {
            const count = assignments.filter((a) => a.subject === s).length;
            return (
              <button
                key={s}
                onClick={() => setSelectedSubject(s)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  selectedSubject === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Assignment List */}
      <div className="space-y-5">
        {filtered.length > 0 ? (
          filtered.map((a) => {
            const sub = a.mySubmission;
            const isSubmitted = !!sub;
            const isGraded = sub?.status === 'GRADED';
            const pct =
              isGraded && sub?.score !== null && sub?.score !== undefined
                ? Math.round((sub.score / a.totalMarks) * 100)
                : null;

            return (
              <div
                key={a.id}
                className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {a.assignmentId}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                        <BookOpen className="w-3 h-3" /> {a.subject}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{a.title}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={a.status === 'OPEN' ? 'warning' : 'neutral'}>
                      {a.status === 'OPEN' ? 'Active / Open' : 'Closed'}
                    </Badge>
                  </div>
                </div>

                {/* Assignment Description */}
                {a.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {a.description}
                  </p>
                )}

                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Deadline: <strong>{a.dueDate}</strong>
                    </span>
                    <span>
                      Max Marks: <strong>{a.totalMarks} pts</strong>
                    </span>
                  </div>

                  {a.attachmentUrl && (
                    <a
                      href={a.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xl font-bold hover:bg-blue-100 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Problem Material
                    </a>
                  )}
                </div>

                {/* Submission Box */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  {isSubmitted ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Submission Timing Badge */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                              sub.isLate
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {sub.timingText || (sub.isLate ? 'Submitted Late' : 'Submitted On Time')}
                          </span>

                          <span className="text-[11px] text-slate-400">
                            {new Date(sub.submittedAt).toLocaleDateString()} at{' '}
                            {new Date(sub.submittedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Grading Status Pill */}
                        <div>
                          {isGraded ? (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-black bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-sm">
                              <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              Score: {sub.score} / {a.totalMarks} Marks ({pct}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800">
                              <AlertCircle className="w-3.5 h-3.5" /> Awaiting Subject Teacher Evaluation
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Student Solution Notes */}
                      {sub.submissionText && (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800">
                          <span className="font-bold text-slate-500 block mb-0.5">My Submitted Notes:</span>
                          {sub.submissionText}
                        </div>
                      )}

                      {/* Teacher Feedback */}
                      {isGraded && sub.feedback && (
                        <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl text-xs text-purple-950 dark:text-purple-200 border border-purple-200/60 dark:border-purple-800/60">
                          <span className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1 mb-0.5">
                            <Award className="w-3.5 h-3.5" /> Instructor Evaluation Remarks:
                          </span>
                          {sub.feedback}
                        </div>
                      )}

                      {/* Download Submitted Solution File & Re-Submit option */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {sub.fileUrl ? (
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600" /> View Uploaded Solution File
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">Text solution submitted</span>
                        )}

                        {a.status === 'OPEN' && !isGraded && (
                          <button
                            onClick={() => handleOpenSubmit(a)}
                            className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                          >
                            <Upload className="w-3.5 h-3.5" /> Re-upload / Update Solution
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Not Submitted Yet
                        </span>
                        <span className="text-[11px] text-slate-400">
                          (Submit before deadline to avoid late marking penalty)
                        </span>
                      </div>

                      {a.status === 'OPEN' ? (
                        <button
                          onClick={() => handleOpenSubmit(a)}
                          className="flex items-center justify-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                        >
                          <Upload className="w-4 h-4" /> Upload & Submit Assignment
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">Submissions Closed</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-semibold">
              No assignments found matching subject filter "{selectedSubject}".
            </p>
          </div>
        )}
      </div>

      {/* Upload Submission Modal */}
      {submittingAssignment && (
        <Modal
          isOpen={!!submittingAssignment}
          onClose={() => setSubmittingAssignment(null)}
          title={`Submit Solution: ${submittingAssignment.title}`}
          subtitle={`Subject: ${submittingAssignment.subject} • Due Date: ${submittingAssignment.dueDate} • Max Marks: ${submittingAssignment.totalMarks} pts`}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitSolution} className="space-y-4">
            {/* File Upload Drop Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Upload Solution File (PDF, Image, Word Doc - Max 10MB)
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.zip"
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    <span className="text-[11px] text-blue-600 font-semibold underline block mt-1">
                      Click to choose a different file
                    </span>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Click to browse or drag & drop solution file
                    </p>
                    <p className="text-[11px] text-slate-400">PDF, PNG, JPG, DOCX supported</p>
                  </div>
                )}
              </div>
            </div>

            {/* Solution Notes / Text Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Solution Notes / Steps & Remarks (Optional)
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={4}
                placeholder="Type your explanation, answers to specific problem questions, or references..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSubmittingAssignment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Uploading Solution...' : 'Confirm & Submit Solution'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
