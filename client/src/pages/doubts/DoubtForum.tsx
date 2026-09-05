import React, { useEffect, useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  PlusCircle,
  Filter,
  Search,
  Lock,
  User,
  GraduationCap,
  Sparkles,
  BookOpen,
  Paperclip,
  Download,
  Eye,
  X,
  FileText,
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
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
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
      setDoubts(res.data.data);
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

  const filteredDoubts = doubts.filter((d) => {
    if (searchQuery.trim()) {
      const words = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const studentName = d.student ? `${d.student.firstName} ${d.student.lastName} ${d.student.studentId || ''} ${d.student.rollNumber || ''}` : '';
        const facultyName = d.faculty ? `${d.faculty.firstName} ${d.faculty.lastName} ${d.faculty.facultyId || ''} ${d.faculty.subjectTaught || ''}` : '';
        const combined = `${d.topic} ${d.questionText} ${d.subject} ${d.answerText || ''} ${studentName} ${facultyName}`.toLowerCase();
        return words.every((w) => combined.includes(w));
      }
    }
    return true;
  });

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

      await doubtApi.create(formData);
      success('Doubt Sent to Mentor', 'Your question and attached files have been routed directly to your chosen instructor');
      setIsAskModalOpen(false);
      setNewTopic('');
      setNewQuestion('');
      setAskFiles([]);
      fetchDoubts();
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
      fetchDoubts();
    } catch (err: any) {
      error('Failed to Resolve', err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <PageHeader
        title={isStudent ? 'Ask a Doubt' : 'Doubt Forum'}
        subtitle={
          isStudent
            ? ''
            : ''
        }
        badge={`${doubts.length} Discussions`}
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

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { label: 'All Discussions', value: '' },
            { label: 'Unresolved / Open', value: 'OPEN' },
            { label: 'Resolved / Answered', value: 'RESOLVED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.value
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 flex-shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doubts"
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Doubts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading doubt discussions...</div>
        ) : filteredDoubts.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-800">
              No Doubts in Discussion
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              {isStudent
                ? 'Got stuck on a tricky physics derivation or math problem? Click "Ask a Doubt" to consult your batch mentor.'
                : 'All student queries have been resolved.'}
            </p>
          </div>
        ) : (
          filteredDoubts.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant={d.status === 'RESOLVED' ? 'success' : 'warning'} size="xs" dot>
                    {d.status === 'RESOLVED' ? 'Resolved' : 'Pending Mentor Answer'}
                  </Badge>
                  <span className="text-xs font-bold text-slate-900">
                    {d.subject} &bull; {d.topic}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>Asked: {formatDate(d.createdAt)}</span>
                  <span>Batch: {d.student?.batch?.name || 'All Batches'}</span>
                </div>
              </div>

              {/* Student Question */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                    {isStudent ? 'Y' : (d.student?.firstName?.[0] || 'S')}
                  </div>
                  <span className="font-semibold text-slate-800">
                    {isStudent
                      ? 'You'
                      : d.student
                      ? `${d.student.firstName} ${d.student.lastName}`
                      : 'Student'}
                  </span>
                  {!isStudent && d.student?.studentId && (
                    <span className="text-[10px] text-slate-400">({d.student.studentId})</span>
                  )}
                </div>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed pl-7">
                  {d.questionText}
                </p>
                {((d.attachments && d.attachments.length > 0) || d.attachmentUrl) && (
                  <div className="pl-7 pt-1.5 space-y-1">
                    <div className="flex flex-wrap gap-2">
                      {(d.attachments && d.attachments.length > 0 ? d.attachments : [d.attachmentUrl!]).map((url, i) => {
                        const rawName = url.split('/').pop()?.split('?')[0] || `Question File #${i + 1}`;
                        const cleanName = rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                        return (
                          <div
                            key={i}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs font-semibold text-blue-900 shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="truncate max-w-[180px]" title={cleanName}>
                              {cleanName || `Question File #${i + 1}`}
                            </span>
                            <div className="flex items-center gap-1 ml-1 border-l border-blue-200 pl-1.5">
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100/80 rounded-md transition-colors flex items-center gap-1"
                                title="View / Open Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold">View</span>
                              </a>
                              <a
                                href={url}
                                download={cleanName}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-100/80 rounded-md transition-colors"
                                title="Download Document"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Mentor Answer if resolved */}
              {d.answerText ? (
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold">
                        Mentor Response &bull;{' '}
                        {isTeacher
                          ? 'You'
                          : d.faculty
                          ? `${d.faculty.firstName} ${d.faculty.lastName}`
                          : 'Faculty Instructor'}
                      </span>
                    </div>
                    {d.answeredAt && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(d.answeredAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed pl-6">
                    {d.answerText}
                  </p>
                  {((d.answerAttachments && d.answerAttachments.length > 0) || d.answerAttachmentUrl) && (
                    <div className="pl-6 pt-1 space-y-1.5">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                        Solution Attachments:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(d.answerAttachments && d.answerAttachments.length > 0
                          ? d.answerAttachments
                          : [d.answerAttachmentUrl!]
                        ).map((url, i) => {
                          const rawName = url.split('/').pop()?.split('?')[0] || `Solution #${i + 1}`;
                          const cleanName = rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                          return (
                            <div
                              key={i}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-semibold text-emerald-900 shadow-2xs"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="truncate max-w-[180px]" title={cleanName}>
                                {cleanName || `Solution File #${i + 1}`}
                              </span>
                              <div className="flex items-center gap-1 ml-1 border-l border-emerald-200 pl-1.5">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100/80 rounded-md transition-colors flex items-center gap-1"
                                  title="View / Open Solution"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-bold">View</span>
                                </a>
                                <a
                                  href={url}
                                  download={cleanName}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-100/80 rounded-md transition-colors"
                                  title="Download Solution"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                isTeacherOrAdmin && (
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="primary"
                      size="xs"
                      leftIcon={MessageSquare}
                      onClick={() => {
                        setAnsweringDoubt(d);
                        setAnswerText('');
                        setAnswerFiles([]);
                      }}
                    >
                      Answer Student Question
                    </Button>
                  </div>
                )
              )}
            </div>
          ))
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
            <label className="block text-xs font-bold text-slate-700 mb-2">
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
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {f.firstName[0]}{f.lastName[0]}
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chapter / Concept Topic:
            </label>
            <input
              type="text"
              required
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder=""
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Question / Problem:
            </label>
            <textarea
              required
              rows={4}
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="State the exact question, problem set number, and where you are stuck..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* File Attachment for Question */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
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
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {askFiles.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-600">
                  Selected Question Attachments ({askFiles.length}):
                </p>
                <div className="flex flex-wrap gap-3 max-h-36 overflow-y-auto p-1 pt-2">
                  {askFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative group flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-semibold shadow-sm"
                    >
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
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
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Student Question:</span>
              <p className="text-slate-800">{answeringDoubt.questionText}</p>
              {((answeringDoubt.attachments && answeringDoubt.attachments.length > 0) || answeringDoubt.attachmentUrl) && (
                <div className="pt-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Student Attached Documents:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(answeringDoubt.attachments && answeringDoubt.attachments.length > 0
                      ? answeringDoubt.attachments
                      : [answeringDoubt.attachmentUrl!]
                    ).map((url, i) => {
                      const rawName = url.split('/').pop()?.split('?')[0] || `Question File #${i + 1}`;
                      const cleanName = rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                      return (
                        <div
                          key={i}
                          className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span className="truncate max-w-[170px]" title={cleanName}>
                            {cleanName || `Question File #${i + 1}`}
                          </span>
                          <div className="flex items-center gap-1 ml-1 border-l border-slate-200 pl-1.5">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1"
                              title="View / Open File"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">View</span>
                            </a>
                            <a
                              href={url}
                              download={cleanName}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                              title="Download File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Faculty Explanation / Solution Steps:
              </label>
              <textarea
                required
                rows={5}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Provide a clear step-by-step breakdown or conceptual solution..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* File Attachment for Answer */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
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
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {answerFiles.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-600">
                    Selected Solution Attachments ({answerFiles.length}):
                  </p>
                  <div className="flex flex-wrap gap-3 max-h-36 overflow-y-auto p-1 pt-2">
                    {answerFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="relative group flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-900 text-xs font-semibold shadow-sm"
                      >
                        <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
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
};
