import React, { useEffect, useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  PlusCircle,
  Filter,
  Lock,
  User,
  GraduationCap,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { doubtApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Doubt } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

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
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [answeringDoubt, setAnsweringDoubt] = useState<Doubt | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const res = await doubtApi.getAll({ status: statusFilter || undefined });
      setDoubts(res.data.data);
    } catch (err) {
      console.error('Failed to load doubts', err);
    } finally {
      setLoading(false);
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
    fetchDoubts();
    if (isStudent) {
      fetchBatchFaculty();
    }
  }, [statusFilter, isStudent]);

  const handleFacultySelect = (faculty: BatchFacultyOption) => {
    setSelectedFacultyId(faculty.id);
    setNewSubject(faculty.subjectTaught || 'Physics');
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
      await doubtApi.create({
        facultyId: selectedFacultyId,
        subject: newSubject,
        topic: newTopic.trim(),
        question: newQuestion.trim(),
      });
      success('Doubt Sent to Mentor', 'Your question has been routed directly to your chosen instructor');
      setIsAskModalOpen(false);
      setNewTopic('');
      setNewQuestion('');
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
      await doubtApi.answer(answeringDoubt.id, { answerText: answerText.trim() });
      success('Doubt Answered', 'Your response has been published to the student');
      setAnsweringDoubt(null);
      setAnswerText('');
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
        title={isStudent ? 'Ask Batch Faculty Mentors' : 'Batch Doubts & Q&A Forum'}
        subtitle={
          isStudent
            ? 'Direct 1-on-1 question routing to subject specialist mentors assigned to your batch.'
            : 'Review academic questions from assigned batch students and provide concept explanations.'
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

      {/* Filter Tabs */}
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
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800/80'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Doubts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading doubt discussions...</div>
        ) : doubts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl">
            <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No Doubts in Discussion
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              {isStudent
                ? 'Got stuck on a tricky physics derivation or math problem? Click "Ask a Doubt" to consult your batch mentor.'
                : 'All student queries have been resolved.'}
            </p>
          </div>
        ) : (
          doubts.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant={d.status === 'RESOLVED' ? 'success' : 'warning'} size="xs" dot>
                    {d.status === 'RESOLVED' ? 'Resolved' : 'Pending Mentor Answer'}
                  </Badge>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {d.subject} &bull; {d.topic}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>Asked: {new Date(d.createdAt).toLocaleDateString()}</span>
                  <span>Batch: {(d.student as any)?.batch?.name || 'Cohort'}</span>
                </div>
              </div>

              {/* Student Question */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px]">
                    {d.student?.firstName?.[0] || 'S'}
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {d.student ? `${d.student.firstName} ${d.student.lastName}` : 'Student'}
                  </span>
                  <span className="text-[10px] text-slate-400">({d.student?.studentId})</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pl-7">
                  {d.questionText}
                </p>
              </div>

              {/* Mentor Answer if resolved */}
              {d.answerText ? (
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                      <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-bold">
                        Mentor Response &bull; {d.faculty ? `${d.faculty.firstName} ${d.faculty.lastName}` : 'Faculty Instructor'}
                      </span>
                    </div>
                    {d.answeredAt && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(d.answeredAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pl-6">
                    {d.answerText}
                  </p>
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
        onClose={() => setIsAskModalOpen(false)}
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
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Chapter / Concept Topic:
            </label>
            <input
              type="text"
              required
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g., Rotational Mechanics Torque Doubt"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsAskModalOpen(false)}
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
          onClose={() => setAnsweringDoubt(null)}
          title={`Answer: ${answeringDoubt.topic}`}
        >
          <form onSubmit={handleResolveDoubt} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Student Question:</span>
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
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setAnsweringDoubt(null)}
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
