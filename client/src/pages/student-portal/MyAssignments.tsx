import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Filter,
  X,
  Eye,
  ChevronRight,
  ArrowLeft,
  Search,
  Check,
  Calendar,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { assignmentApi, studentApi } from '../../services/api';
import { Assignment, AssignmentSubmission } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatDateTime } from '../../utils/date';
import { getMediaUrl, downloadMediaFile } from '../../utils/media';

export const MyAssignments: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [batchSubjects, setBatchSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [deadlineSort, setDeadlineSort] = useState<'OLDEST' | 'NEWEST'>('NEWEST');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'SUBMITTED' | 'GRADED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected assignment for full page view
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Upload/Submission form state
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStudentBatchInfo = async () => {
    try {
      const res = await studentApi.getMyProfile();
      const profile = res.data?.data;
      const subs: string[] = [];
      if (profile?.batch?.subjectInstructors && Array.isArray(profile.batch.subjectInstructors)) {
        profile.batch.subjectInstructors.forEach((inst: any) => {
          if (inst.subject) subs.push(inst.subject);
        });
      }
      if (profile?.batch?.faculty?.subjectTaught) {
        subs.push(profile.batch.faculty.subjectTaught);
      }
      if (profile?.course?.subjects) {
        if (Array.isArray(profile.course.subjects)) {
          subs.push(...profile.course.subjects);
        } else if (typeof profile.course.subjects === 'string') {
          try {
            const parsed = JSON.parse(profile.course.subjects);
            if (Array.isArray(parsed)) subs.push(...parsed);
          } catch {
            subs.push(profile.course.subjects);
          }
        }
      }
      setBatchSubjects(Array.from(new Set(subs.filter(Boolean))));
    } catch {
      // ignore
    }
  };

  const fetchAssignments = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await assignmentApi.getMyAssignments();
      const list: Assignment[] = res.data?.data || [];
      setAssignments(list);

      // If URL contains assignment id, open it directly
      const urlId = searchParams.get('id');
      if (urlId) {
        const found = list.find((a) => a.id === urlId);
        if (found) {
          setSelectedAssignment(found);
        }
      }
    } catch (err) {
      console.error('Failed to load my assignments', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments(true);
    fetchStudentBatchInfo();
    const interval = setInterval(() => {
      fetchAssignments(false);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Update selectedAssignment when assignments list updates in background
  useEffect(() => {
    if (selectedAssignment) {
      const updated = assignments.find((a) => a.id === selectedAssignment.id);
      if (updated) {
        setSelectedAssignment(updated);
      }
    }
  }, [assignments]);

  const handleSelectAssignment = (a: Assignment) => {
    setSelectedAssignment(a);
    setShowUploadForm(!a.mySubmission);
    setSubmissionText(a.mySubmission?.submissionText || '');
    setSelectedFiles([]);
    setSearchParams({ id: a.id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedAssignment(null);
    setShowUploadForm(false);
    setSelectedFiles([]);
    setSubmissionText('');
    setSearchParams({});
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
    if (!selectedAssignment) return;

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

      await assignmentApi.submit(selectedAssignment.id, formData);
      success(
        'Assignment Submitted!',
        'Your solution files have been recorded with timestamp and queued for faculty evaluation'
      );
      setSelectedFiles([]);
      setShowUploadForm(false);
      fetchAssignments();
    } catch (err: any) {
      error('Submission Failed', err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjects = Array.from(
    new Set([
      ...batchSubjects,
      ...assignments.map((a) => a.subject).filter(Boolean),
    ])
  ).filter(Boolean);

  const filteredAssignments = assignments
    .filter((a) => {
      const matchesSubject = selectedSubject === 'ALL' || a.subject === selectedSubject;
      const isSubmitted = !!a.mySubmission;
      const isGraded = a.mySubmission?.status === 'GRADED';
      const isDuePassed = new Date(a.dueDate) < new Date();

      let matchesStatus = true;
      if (statusFilter === 'PENDING') matchesStatus = !isSubmitted && !isDuePassed;
      if (statusFilter === 'OVERDUE') matchesStatus = !isSubmitted && isDuePassed;
      if (statusFilter === 'SUBMITTED') matchesStatus = isSubmitted && !isGraded;
      if (statusFilter === 'GRADED') matchesStatus = isGraded;

      const matchesSearch =
        !searchQuery.trim() ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.assignmentId && a.assignmentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.subject && a.subject.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSubject && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      const timeA = new Date(a.dueDate).getTime();
      const timeB = new Date(b.dueDate).getTime();
      if (deadlineSort === 'OLDEST') {
        return timeA - timeB;
      }
      return timeB - timeA;
    });

  if (loading && assignments.length === 0) {
    return <LoadingSkeleton count={5} />;
  }

  // =========================================================================
  // VIEW 1: FULL PAGE / DETAIL VIEW FOR SELECTED ASSIGNMENT
  // =========================================================================
  if (selectedAssignment) {
    const a = selectedAssignment;
    const sub = a.mySubmission;
    const isSubmitted = !!sub;
    const isGraded = sub?.status === 'GRADED';
    const isDuePassed = new Date(a.dueDate) < new Date();
    const pct =
      isGraded && sub?.score !== null && sub?.score !== undefined
        ? Math.round((sub.score / a.totalMarks) * 100)
        : null;

    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-12">
        {/* Back Navigation Bar */}
        <div>
          <button
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to All Assignments</span>
          </button>
        </div>

        {/* Assignment Hero Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <span>
                  Subject: <strong className="text-slate-900 dark:text-slate-100 font-bold">{a.subject}</strong>
                </span>
                {a.batch?.name && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>
                      Batch: <strong className="text-slate-900 dark:text-slate-100 font-bold">{a.batch.name}</strong>
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {a.title}
              </h1>
            </div>

            {/* Quick Score Tag if Graded */}
            {isGraded && (
              <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800 rounded-2xl text-center sm:text-right flex-shrink-0">
                <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider block">
                  Final Evaluated Score
                </span>
                <span className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300">
                  {sub.score} / {a.totalMarks}
                </span>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block">
                  ({pct}%)
                </span>
              </div>
            )}
          </div>

          {/* Due Date & Max Marks Key Metric Strips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Submission Deadline</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {formatDate(a.dueDate)}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Weightage</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {a.totalMarks} Marks
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isGraded
                  ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/50'
                  : isSubmitted
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'
                  : isDuePassed
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50'
              }`}>
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">My Status</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isGraded ? 'Graded & Evaluated' : isSubmitted ? 'Submitted' : 'Pending Submission'}
                </p>
              </div>
            </div>
          </div>

          {/* Full Assignment Description */}
          {a.description && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Assignment Instructions & Questions
              </h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {a.description}
              </div>
            </div>
          )}

          {/* Teacher's Attachment Downloads (Question Papers, Reference PDFs) */}
          {((a.attachments && a.attachments.length > 0) || a.attachmentUrl) && (
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                <span>Reference Problem Materials & Attachments</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(a.attachments && a.attachments.length > 0 ? a.attachments : [a.attachmentUrl!]).map((attUrl, attIdx) => {
                  const rawName = attUrl.split('/').pop() || `Problem Material #${attIdx + 1}`;
                  const cleanName = rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;

                  return (
                    <div
                      key={attIdx}
                      className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate" title={cleanName}>
                            {cleanName}
                          </p>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block">
                            Instructor Attachment
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <a
                          href={getMediaUrl(attUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 text-xs font-bold border border-blue-200/80 dark:border-blue-900 flex items-center gap-1 transition-colors shadow-2xs"
                          title="View / Open File"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadMediaFile(attUrl, cleanName)}
                          className="p-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors shadow-2xs"
                          title="Download File"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* SUBMISSION & UPLOAD SECTION */}
        {/* ================================================================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                My Solution & Submission
              </h3>
            </div>
          </div>

          {/* Already Submitted View */}
          {isSubmitted && !showUploadForm ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                      sub.isLate
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {sub.timingText || (sub.isLate ? 'Submitted Late' : 'Submitted On Time')}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Recorded on {formatDateTime(sub.submittedAt)}
                  </span>
                </div>

                <div>
                  {isGraded ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                      <Award className="w-4 h-4 text-purple-600" /> Score: {sub.score} / {a.totalMarks} Marks ({pct}%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                      <AlertCircle className="w-3.5 h-3.5" /> Awaiting Faculty Evaluation
                    </span>
                  )}
                </div>
              </div>

              {/* Student Submitted Notes */}
              {sub.submissionText && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1 text-xs uppercase tracking-wider">
                    My Solution Notes:
                  </span>
                  {sub.submissionText}
                </div>
              )}

              {/* Teacher Feedback / Remarks */}
              {isGraded && sub.feedback && (
                <div className="p-4 bg-purple-50/70 dark:bg-purple-950/40 rounded-2xl border border-purple-200/80 dark:border-purple-900 text-xs sm:text-sm text-purple-950 dark:text-purple-200">
                  <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider">
                    <Award className="w-4 h-4" /> Instructor Evaluation Feedback:
                  </span>
                  {sub.feedback}
                </div>
              )}

              {/* Student Uploaded Files */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Submitted Files
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {((sub.files && sub.files.length > 0) || sub.fileUrl) ? (
                    (sub.files && sub.files.length > 0 ? sub.files : [sub.fileUrl!]).map((sUrl, sIdx) => {
                      const rawName = sUrl.split('/').pop() || `Solution File #${sIdx + 1}`;
                      const cleanName = rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;

                      return (
                        <div
                          key={sIdx}
                          className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={cleanName}>
                              {cleanName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <a
                              href={getMediaUrl(sUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                              title="View file"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </a>
                            <button
                              type="button"
                              onClick={() => downloadMediaFile(sUrl, cleanName)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded-lg"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-400">Only written solution text submitted</span>
                  )}
                </div>
              </div>

              {/* Update Solution Action Button - Bottom Right */}
              {isSubmitted && !showUploadForm && a.status === 'OPEN' && !isGraded && (
                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(true)}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200/80 dark:border-rose-900 transition-colors shadow-2xs"
                  >
                    Update Solution
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Upload / Submission Form */
            <form onSubmit={handleSubmitSolution} className="space-y-4">
              {/* File Upload Drop Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-blue-600" /> Upload Solution Documents / Photos
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">PDF, Images, Word Docs (Max 25MB each)</span>
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-7 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-950/60 group text-center"
                >
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.zip"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Click to browse files or drag & drop here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Attach clear photos of handwritten calculations, diagrams, or scanned solution PDF
                  </p>
                </div>

                {/* Selected Files Preview Chips */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Selected Files ({selectedFiles.length}):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs font-semibold"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{file.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({(file.size / 1024).toFixed(0)} KB)
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="p-1 hover:bg-emerald-200/60 dark:hover:bg-emerald-900 rounded-lg text-rose-500"
                              title="Remove file"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Solution Text Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Solution Comments & Step-by-Step Answers (Optional)
                </label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  rows={4}
                  placeholder="Type any answers, explanations, or note to your instructor here..."
                  className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {isSubmitted && (
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel Re-upload
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || a.status !== 'OPEN'}
                  className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Uploading Solution...' : 'Submit Assignment Solution'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: COMPACT ROW-BY-ROW TABLE LIST VIEW (DEFAULT)
  // =========================================================================
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* Top Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          My Assignments
        </h1>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assignments..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                &times;
              </button>
            )}
          </div>

          {/* Subject Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Deadline Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sort:</span>
            <select
              value={deadlineSort}
              onChange={(e) => setDeadlineSort(e.target.value as 'OLDEST' | 'NEWEST')}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="GRADED">Graded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments Row Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-50/70 dark:bg-slate-950/50 select-none">
              <tr className="border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Assignment</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((a) => {
                  const sub = a.mySubmission;
                  const isSubmitted = !!sub;
                  const isGraded = sub?.status === 'GRADED';
                  const isDuePassed = new Date(a.dueDate) < new Date();
                  const pct =
                    isGraded && sub?.score !== null && sub?.score !== undefined
                      ? Math.round((sub.score / a.totalMarks) * 100)
                      : null;

                  return (
                    <tr
                      key={a.id}
                      onClick={() => handleSelectAssignment(a)}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Title */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {a.title}
                        </span>
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900">
                          <BookOpen className="w-3 h-3" /> {a.subject}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className={`w-3.5 h-3.5 ${isDuePassed && !isSubmitted ? 'text-rose-500' : 'text-slate-400'}`} />
                          <span className={`font-medium ${isDuePassed && !isSubmitted ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                            {formatDate(a.dueDate)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-right">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                            <Award className="w-3 h-3 text-purple-600" />
                            {sub.score}/{a.totalMarks} ({pct}%)
                          </span>
                        ) : isSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900">
                            <Check className="w-3 h-3" /> Submitted
                          </span>
                        ) : isDuePassed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        No assignments found
                      </p>
                      <p className="text-xs text-slate-400">
                        Try adjusting your subject or status filter above.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
