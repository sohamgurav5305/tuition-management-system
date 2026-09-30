import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  PlusCircle,
  Search,
  User,
  GraduationCap,
  Sparkles,
  BookOpen,
  Paperclip,
  Download,
  Eye,
  X,
  FileText,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { doubtApi } from '../../services/api';
import { Doubt } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { formatDate } from '../../utils/date';
import { getMediaUrl, downloadMediaFile } from '../../utils/media';

interface BatchFacultyOption {
  id: string;
  facultyId: string;
  firstName: string;
  lastName: string;
  subjectTaught: string;
  qualification: string;
  avatarUrl?: string | null;
  isLead?: boolean;
}

export const DoubtForum: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDoubtId = searchParams.get('id');

  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [answeringDoubt, setAnsweringDoubt] = useState<Doubt | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File attachments
  const [askFiles, setAskFiles] = useState<File[]>([]);
  const [answerFiles, setAnswerFiles] = useState<File[]>([]);

  // Batch assigned faculty mentors for student
  const [batchFaculty, setBatchFaculty] = useState<BatchFacultyOption[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');

  // Form states for new doubt
  const [newSubject, setNewSubject] = useState('Physics');
  const [newTopic, setNewTopic] = useState('');
  const [newQuestion, setNewQuestion] = useState('');

  const isStudent = user?.role === 'STUDENT';
  const isTeacher = user?.role === 'TEACHER';
  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMINISTRATOR';

  const fetchDoubts = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await doubtApi.getAll({ status: statusFilter || undefined });
      setDoubts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load doubts', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchBatchFaculty = async () => {
    try {
      const res = await doubtApi.getBatchFaculty();
      const list = res.data.data || [];
      setBatchFaculty(list);
      if (list.length > 0) {
        setSelectedFacultyId(list[0].id);
        setNewSubject(list[0].subjectTaught || 'Physics');
      }
    } catch (err) {
      console.error('Failed to load batch faculty mentors', err);
    }
  };

  useEffect(() => {
    fetchDoubts(true);
    if (isStudent) {
      fetchBatchFaculty();
    }
    const interval = setInterval(() => {
      fetchDoubts(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [statusFilter, isStudent]);

  const uniqueSubjects = Array.from(
    new Set(doubts.map((d) => d.subject).filter(Boolean))
  );

  const filteredDoubts = doubts.filter((d) => {
    // Subject filter
    if (subjectFilter !== 'ALL' && d.subject !== subjectFilter) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const words = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const studentName = d.student
          ? `${d.student.firstName} ${d.student.lastName} ${d.student.studentId || ''} ${d.student.rollNumber || ''}`
          : '';
        const facultyName = d.faculty
          ? `${d.faculty.firstName} ${d.faculty.lastName} ${d.faculty.facultyId || ''} ${d.faculty.subjectTaught || ''}`
          : '';
        const combined = `${d.topic} ${d.questionText} ${d.subject} ${d.answerText || ''} ${studentName} ${facultyName}`.toLowerCase();
        return words.every((w) => combined.includes(w));
      }
    }
    return true;
  });

  const selectedDoubt = selectedDoubtId
    ? doubts.find((d) => d.id === selectedDoubtId)
    : null;

  const handleSelectDoubt = (id: string) => {
    setSearchParams({ id });
  };

  const handleClearSelectedDoubt = () => {
    setSearchParams({});
  };

  const handleFacultySelect = (faculty: BatchFacultyOption) => {
    setSelectedFacultyId(faculty.id);
    setNewSubject(faculty.subjectTaught || 'Physics');
  };

  const handleAskFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAskFiles((prev) => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removeAskFile = (index: number) => {
    setAskFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnswerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAnswerFiles((prev) => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removeAnswerFile = (index: number) => {
    setAnswerFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAskDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacultyId) {
      error('Mentor Required', 'Please choose a faculty mentor from your batch');
      return;
    }
    if (!newTopic.trim() || !newQuestion.trim()) {
      error('Fields Required', 'Topic and question description are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('facultyId', selectedFacultyId);
      formData.append('subject', newSubject);
      formData.append('topic', newTopic.trim());
      formData.append('questionText', newQuestion.trim());
      formData.append('question', newQuestion.trim());
      if (askFiles.length > 0) {
        askFiles.forEach((file) => {
          formData.append('files', file);
        });
      }

      const res = await doubtApi.create(formData);
      success('Doubt Sent to Mentor', 'Your question and attached files have been routed directly to your chosen instructor');
      setIsAskModalOpen(false);
      setNewTopic('');
      setNewQuestion('');
      setAskFiles([]);
      await fetchDoubts();
      if (res?.data?.data?.id) {
        setSearchParams({ id: res.data.data.id });
      }
    } catch (err: any) {
      error('Failed to Submit', err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answeringDoubt || !answerText.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('answerText', answerText.trim());
      if (answerFiles.length > 0) {
        answerFiles.forEach((file) => {
          formData.append('files', file);
        });
      }

      await doubtApi.answer(answeringDoubt.id, formData);
      success('Doubt Answered', 'Your response and explanation files have been published to the student');
      setAnsweringDoubt(null);
      setAnswerText('');
      setAnswerFiles([]);
      await fetchDoubts();
    } catch (err: any) {
      error('Failed to Resolve', err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW 2: DEDICATED FULL DISCUSSION / THREAD VIEW
  // -------------------------------------------------------------
  if (selectedDoubt) {
    const isResolved = selectedDoubt.status === 'RESOLVED';
    const questionAttachments =
      selectedDoubt.attachments && selectedDoubt.attachments.length > 0
        ? selectedDoubt.attachments
        : selectedDoubt.attachmentUrl
        ? [selectedDoubt.attachmentUrl]
        : [];

    const solutionAttachments =
      selectedDoubt.answerAttachments && selectedDoubt.answerAttachments.length > 0
        ? selectedDoubt.answerAttachments
        : selectedDoubt.answerAttachmentUrl
        ? [selectedDoubt.answerAttachmentUrl]
        : [];

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation & Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={handleClearSelectedDoubt}
            className="self-start text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            Back to All Discussions
          </Button>

          {isTeacherOrAdmin && !isResolved && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={MessageSquare}
              onClick={() => {
                setAnsweringDoubt(selectedDoubt);
                setAnswerText('');
                setAnswerFiles([]);
              }}
            >
              Answer Student Question
            </Button>
          )}
        </div>

        {/* Hero Discussion Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                <BookOpen className="w-3.5 h-3.5" />
                {selectedDoubt.subject}
              </span>
              <Badge variant={isResolved ? 'success' : 'warning'} size="sm" dot>
                {isResolved ? 'Resolved / Answered' : 'Pending Mentor Answer'}
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Asked: {formatDate(selectedDoubt.createdAt)}
              </span>
              {selectedDoubt.student?.batch?.name && (
                <span>&bull; Batch: {selectedDoubt.student.batch.name}</span>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {selectedDoubt.topic}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Discussion routed to{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedDoubt.faculty
                  ? `Prof. ${selectedDoubt.faculty.firstName} ${selectedDoubt.faculty.lastName}`
                  : 'Assigned Faculty Mentor'}
              </span>
            </p>
          </div>
        </div>

        {/* Question & Solution Container */}
        <div className="space-y-5">
          {/* Student Question Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  {isStudent ? 'Y' : (selectedDoubt.student?.firstName?.[0] || 'S')}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {isStudent
                      ? 'You (Student)'
                      : selectedDoubt.student
                      ? `${selectedDoubt.student.firstName} ${selectedDoubt.student.lastName}`
                      : 'Student'}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    {selectedDoubt.student?.rollNumber
                      ? `Roll: ${selectedDoubt.student.rollNumber}`
                      : selectedDoubt.student?.studentId
                      ? `ID: ${selectedDoubt.student.studentId}`
                      : 'Student Member'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Question Statement
              </span>
            </div>

            <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {selectedDoubt.questionText}
            </div>

            {/* Question Attachments */}
            {questionAttachments.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Question Attachments ({questionAttachments.length}):
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {questionAttachments.map((url, i) => {
                    const rawName =
                      url.split('/').pop()?.split('?')[0] || `Question File #${i + 1}`;
                    const cleanName =
                      rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                    return (
                      <div
                        key={i}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100 shadow-2xs"
                      >
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px]" title={cleanName}>
                          {cleanName}
                        </span>
                        <div className="flex items-center gap-1 ml-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                          <a
                            href={getMediaUrl(url)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                            title="View Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </a>
                          <button
                            type="button"
                            onClick={() => downloadMediaFile(url, cleanName)}
                            className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors"
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

          {/* Mentor Solution Card */}
          {selectedDoubt.answerText ? (
            <div className="p-6 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-emerald-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      Mentor Response &bull;{' '}
                      {isTeacher
                        ? 'You (Instructor)'
                        : selectedDoubt.faculty
                        ? `Prof. ${selectedDoubt.faculty.firstName} ${selectedDoubt.faculty.lastName}`
                        : 'Faculty Instructor'}
                    </h3>
                    {selectedDoubt.answeredAt && (
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 font-mono">
                        Answered on {formatDate(selectedDoubt.answeredAt)}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="success" size="sm" dot>
                  Verified Solution
                </Badge>
              </div>

              <div className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed pl-1">
                {selectedDoubt.answerText}
              </div>

              {/* Solution Attachments */}
              {solutionAttachments.length > 0 && (
                <div className="pt-3 border-t border-emerald-100 dark:border-emerald-800/40 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Solution Attachments ({solutionAttachments.length}):
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {solutionAttachments.map((url, i) => {
                      const rawName =
                        url.split('/').pop()?.split('?')[0] || `Solution #${i + 1}`;
                      const cleanName =
                        rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                      return (
                        <div
                          key={i}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-semibold text-emerald-950 dark:text-emerald-200 shadow-2xs"
                        >
                          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]" title={cleanName}>
                            {cleanName}
                          </span>
                          <div className="flex items-center gap-1 ml-1 border-l border-emerald-100 dark:border-emerald-800 pl-2">
                            <a
                              href={getMediaUrl(url)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                              title="View Solution"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() => downloadMediaFile(url, cleanName)}
                              className="p-1 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
                              title="Download Solution"
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
          ) : (
            <div className="p-6 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-3xl flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Awaiting Mentor Response
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1">
                  {isStudent
                    ? 'Your question is in the instructor queue. You will receive an immediate notification as soon as your batch mentor publishes the explanation steps.'
                    : 'This student doubt is pending your evaluation. Click "Answer Student Question" above to publish the step-by-step resolution.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Answer Modal */}
        {answeringDoubt && (
          <Modal
            isOpen={!!answeringDoubt}
            onClose={() => {
              setAnsweringDoubt(null);
              setAnswerFiles([]);
            }}
            title={`Answer: ${answeringDoubt.topic}`}
          >
            <form onSubmit={handleResolveDoubt} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  Student Question:
                </span>
                <p className="text-slate-800 dark:text-slate-200">{answeringDoubt.questionText}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Faculty Explanation / Solution Steps:
                </label>
                <textarea
                  required
                  rows={5}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Provide a clear step-by-step breakdown or conceptual solution..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              {/* File Attachment for Answer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Paperclip className="w-3.5 h-3.5 text-purple-600" /> Attachments (Multiple Files Allowed):
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">PDF, Images, DOCX, ZIP (Max 25MB each)</span>
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.zip"
                  onChange={handleAnswerFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-950 dark:file:text-purple-300"
                />
                {answerFiles.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Selected Solution Attachments ({answerFiles.length}):
                    </p>
                    <div className="flex flex-wrap gap-3 max-h-36 overflow-y-auto p-1 pt-2">
                      {answerFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="relative group flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs font-semibold shadow-sm"
                        >
                          <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="truncate max-w-[170px]" title={file.name}>
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {(file.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAnswerFile(idx)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer z-10"
                            title="Delete attachment"
                            aria-label={`Delete ${file.name}`}
                          >
                            <X className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setAnsweringDoubt(null);
                    setAnswerFiles([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={CheckCircle2}
                  isLoading={isSubmitting}
                >
                  Publish Answer
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 1: COMPACT ROW-BY-ROW TABLE LIST (DEFAULT VIEW)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <PageHeader
        title={isStudent ? 'Ask a Doubt' : 'Doubt Forum'}
        actions={
          isStudent && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => {
                if (batchFaculty.length === 0) {
                  fetchBatchFaculty();
                }
                setIsAskModalOpen(true);
              }}
            >
              Ask a Doubt
            </Button>
          )
        }
      />

      {/* Filter Toolbar & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, mentor, student..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          {/* Subject Filter Dropdown */}
          {uniqueSubjects.length > 1 && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">All Subjects</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          )}

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
          >
            <option value="">All</option>
            <option value="OPEN">Unresolved</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Row Table Format */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton count={4} />
          </div>
        ) : filteredDoubts.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Discussions Found
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {isStudent
                ? 'Got stuck on a tricky physics derivation or math problem? Click "Ask a Doubt" to consult your batch mentor.'
                : 'All student inquiries for this filter have been answered.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Topic / Question</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">{isStudent ? 'Assigned Mentor' : 'Student'}</th>
                  <th className="px-4 py-3">Date Asked</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDoubts.map((d) => {
                  const isResolved = d.status === 'RESOLVED';
                  const hasAttachments =
                    (d.attachments && d.attachments.length > 0) ||
                    d.attachmentUrl ||
                    (d.answerAttachments && d.answerAttachments.length > 0) ||
                    d.answerAttachmentUrl;

                  return (
                    <tr
                      key={d.id}
                      onClick={() => handleSelectDoubt(d.id)}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Topic & Question snippet */}
                      <td className="px-4 py-3.5 max-w-xs sm:max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {d.topic}
                          </span>
                          {hasAttachments && (
                            <span
                              className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-0.5 text-[10px]"
                              title="Files Attached"
                            >
                              <Paperclip className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {d.questionText}
                        </p>
                      </td>

                      {/* Subject Pill */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                          {d.subject}
                        </span>
                      </td>

                      {/* Mentor / Student */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {isStudent ? (
                          <div className="flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="font-medium">
                              {d.faculty
                                ? `Prof. ${d.faculty.firstName} ${d.faculty.lastName}`
                                : 'Assigned Mentor'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            <span className="font-medium">
                              {d.student
                                ? `${d.student.firstName} ${d.student.lastName}`
                                : 'Student'}
                            </span>
                            {d.student?.batch?.name && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({d.student.batch.name})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(d.createdAt)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <Badge variant={isResolved ? 'success' : 'warning'} size="sm" dot>
                          {isResolved ? 'Resolved' : 'Pending Answer'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ask Doubt Modal */}
      <Modal
        isOpen={isAskModalOpen}
        onClose={() => {
          setIsAskModalOpen(false);
          setAskFiles([]);
        }}
        title="Ask Batch Faculty Mentor"
      >
        <form onSubmit={handleAskDoubt} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Select Batch Faculty Mentor:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {batchFaculty.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFacultySelect(f)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                    selectedFacultyId === f.id
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 dark:bg-blue-950/60 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden">
                    {f.avatarUrl ? (
                      <img src={getMediaUrl(f.avatarUrl)} alt="Mentor" className="w-full h-full object-cover" />
                    ) : (
                      `${f.firstName[0]}${f.lastName[0]}`
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">
                      {f.firstName} {f.lastName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {f.subjectTaught} Specialist
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Chapter / Concept Topic:
            </label>
            <input
              type="text"
              required
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g. Newton's 2nd Law Application"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Question / Problem:
            </label>
            <textarea
              required
              rows={4}
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="State the exact question, problem set number, and where you are stuck..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          {/* File Attachment for Question */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" /> Attachments (Multiple Files Allowed):
              </span>
              <span className="text-[11px] text-slate-400 font-normal">PDF, Images, DOCX, ZIP (Max 25MB each)</span>
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.zip"
              onChange={handleAskFileChange}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300"
            />
            {askFiles.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Selected Question Attachments ({askFiles.length}):
                </p>
                <div className="flex flex-wrap gap-3 max-h-36 overflow-y-auto p-1 pt-2">
                  {askFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative group flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs font-semibold shadow-sm"
                    >
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="truncate max-w-[170px]" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAskFile(idx)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer z-10"
                        title="Delete attachment"
                        aria-label={`Delete ${file.name}`}
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsAskModalOpen(false);
                setAskFiles([]);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={Send}
              isLoading={isSubmitting}
            >
              Send Question
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
