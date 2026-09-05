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
  Paperclip,
  Check,
  Filter,
  X,
  Eye,
} from 'lucide-react';
import { assignmentApi } from '../../services/api';
import { Assignment, AssignmentSubmission } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatDateTime } from '../../utils/date';
import { getMediaUrl, downloadMediaFile } from '../../utils/media';

export const MyAssignments: React.FC = () => {
  const { success, error } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  // Submission Modal state
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssignments = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await assignmentApi.getMyAssignments();
      setAssignments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load my assignments', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments(true);
    const interval = setInterval(() => {
      fetchAssignments(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenSubmit = (a: Assignment) => {
    setSubmittingAssignment(a);
    setSubmissionText(a.mySubmission?.submissionText || '');
    setSelectedFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment) return;

    if (selectedFiles.length === 0 && !submissionText.trim()) {
      error('Input Required', 'Please upload at least one solution file or provide solution notes');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });
      }
      if (submissionText.trim()) {
        formData.append('submissionText', submissionText.trim());
      }

      await assignmentApi.submit(submittingAssignment.id, formData);
      success(
        'Assignment Submitted!',
        'Your solution files have been recorded with timestamp and queued for faculty grading'
      );
      setSubmittingAssignment(null);
      setSelectedFiles([]);
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Assignments
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            
          </p>
        </div>
      </div>

      {/* Subject Filter Bar */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter by Subject:
          </span>
          <button
            onClick={() => setSelectedSubject('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedSubject === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600">
                        {a.assignmentId}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                        <BookOpen className="w-3 h-3" /> {a.subject}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{a.title}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={a.status === 'OPEN' ? 'warning' : 'neutral'}>
                      {a.status === 'OPEN' ? 'Active / Open' : 'Closed'}
                    </Badge>
                  </div>
                </div>

                {/* Assignment Description */}
                {a.description && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {a.description}
                  </p>
                )}

                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Deadline: <strong>{formatDate(a.dueDate)}</strong>
                    </span>
                    <span>
                      Max Marks: <strong>{a.totalMarks} pts</strong>
                    </span>
                  </div>

                  {((a.attachments && a.attachments.length > 0) || a.attachmentUrl) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {(a.attachments && a.attachments.length > 0 ? a.attachments : [a.attachmentUrl!]).map((attUrl, attIdx) => {
                        const rawName = attUrl.split('/').pop() || `Problem Material #${attIdx + 1}`;
                        const cleanName = rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                        return (
                          <div
                            key={attIdx}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs font-semibold text-blue-900 shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="truncate max-w-[180px]" title={cleanName}>
                              {cleanName}
                            </span>
                            <div className="flex items-center gap-1 ml-1 border-l border-blue-200 pl-1.5">
                              <a
                                href={getMediaUrl(attUrl)}
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
                                onClick={() => downloadMediaFile(attUrl, cleanName)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-100/80 rounded-md transition-colors"
                                title="Download File"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Submission Box */}
                <div className="pt-3 border-t border-slate-100">
                  {isSubmitted ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Submission Timing Badge */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                              sub.isLate
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {sub.timingText || (sub.isLate ? 'Submitted Late' : 'Submitted On Time')}
                          </span>

                          <span className="text-[11px] text-slate-400">
                            {formatDateTime(sub.submittedAt)}
                          </span>
                        </div>

                        {/* Grading Status Pill */}
                        <div>
                          {isGraded ? (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 shadow-sm">
                              <Award className="w-4 h-4 text-purple-600" />
                              Score: {sub.score} / {a.totalMarks} Marks ({pct}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                              <AlertCircle className="w-3.5 h-3.5" /> Awaiting Subject Teacher Evaluation
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Student Solution Notes */}
                      {sub.submissionText && (
                        <div className="p-3 bg-white rounded-xl text-xs text-slate-700 border border-slate-200/60">
                          <span className="font-bold text-slate-500 block mb-0.5">My Submitted Notes:</span>
                          {sub.submissionText}
                        </div>
                      )}

                      {/* Teacher Feedback */}
                      {isGraded && sub.feedback && (
                        <div className="p-3 bg-purple-50/70 rounded-xl text-xs text-purple-950 border border-purple-200/60">
                          <span className="font-bold text-purple-700 flex items-center gap-1 mb-0.5">
                            <Award className="w-3.5 h-3.5" /> Instructor Evaluation Remarks:
                          </span>
                          {sub.feedback}
                        </div>
                      )}

                      {/* Download/View Submitted Solution Files & Re-Submit option */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {((sub.files && sub.files.length > 0) || sub.fileUrl) ? (
                            (sub.files && sub.files.length > 0 ? sub.files : [sub.fileUrl!]).map((sUrl, sIdx) => {
                              const rawName = sUrl.split('/').pop() || `Solution File #${sIdx + 1}`;
                              const cleanName = rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                              return (
                                <div
                                  key={sIdx}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                  <span className="truncate max-w-[170px]" title={cleanName}>
                                    {cleanName}
                                  </span>
                                  <div className="flex items-center gap-1 ml-1 border-l border-slate-200 pl-1.5">
                                    <a
                                      href={getMediaUrl(sUrl)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1"
                                      title="View / Open File"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span className="text-[11px] font-bold">View</span>
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => downloadMediaFile(sUrl, cleanName)}
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                      title="Download File"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-[11px] text-slate-400">Text solution submitted</span>
                          )}
                        </div>

                        {a.status === 'OPEN' && !isGraded && (
                          <button
                            onClick={() => handleOpenSubmit(a)}
                            className="flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
                          >
                            <Upload className="w-3.5 h-3.5" /> Re-upload / Update Solution
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/60 border border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-bold text-slate-700">
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
          <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
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
          subtitle={`Subject: ${submittingAssignment.subject} • Due Date: ${formatDate(submittingAssignment.dueDate)} • Max Marks: ${submittingAssignment.totalMarks} pts`}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitSolution} className="space-y-4">
            {/* File Upload Drop Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" /> Upload Solution Files
                </span>
                <span className="text-[11px] text-slate-400 font-normal">PDF, Images, Word Docs (Max 25MB each)</span>
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all border-slate-300 hover:border-blue-500 bg-slate-50"
              >
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.zip"
                  className="hidden"
                />
                <div className="text-center space-y-1.5">
                  <Upload className="w-7 h-7 text-blue-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    Click to browse or drag & drop solution files
                  </p>
                  <p className="text-[11px] text-slate-400">Attach multiple photos of handwritten work, diagrams, or PDFs</p>
                </div>
              </div>

              {/* Selected Files Preview Chips */}
              {selectedFiles.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-600">
                    Attached Files ({selectedFiles.length}):
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="truncate max-w-[170px]">{file.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="p-0.5 hover:bg-emerald-200/60 rounded-full text-rose-500 ml-1"
                          title="Remove file"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Solution Notes / Text Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Comments
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={4}
                placeholder="Type your explanation, answers to specific problem questions, or references..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSubmittingAssignment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl"
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
