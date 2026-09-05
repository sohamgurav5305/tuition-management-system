import React, { useEffect, useState } from 'react';
import {
  X,
  PlusCircle,
  Users,
  Layers,
  User,
} from 'lucide-react';
import { batchApi, studentApi, paymentApi } from '../../services/api';
import { Batch, Student } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';

interface AssignFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialStudent?: Student | null;
  initialBatchId?: string;
}

export const AssignFeeModal: React.FC<AssignFeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStudent,
  initialBatchId,
}) => {
  const { success, error } = useToast();
  const { formatCurrency, formatDate } = useSettings();

  const [targetType, setTargetType] = useState<'ALL' | 'BATCH' | 'STUDENT'>('ALL');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');

  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('EXAM');
  const [amount, setAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });

  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const loadOptions = async () => {
        try {
          setLoadingData(true);
          const [batchRes, stuRes] = await Promise.all([
            batchApi.getAll({ status: 'ACTIVE' }),
            studentApi.getAll({ status: 'ACTIVE' }),
          ]);
          setBatches(batchRes.data?.data || []);
          setStudents(stuRes.data?.data || []);
        } catch (err) {
          console.error('Failed to load options for fee assignment', err);
        } finally {
          setLoadingData(false);
        }
      };
      loadOptions();

      if (initialStudent) {
        setTargetType('STUDENT');
        setSelectedStudentId(initialStudent.id);
      } else if (initialBatchId) {
        setTargetType('BATCH');
        setSelectedBatchId(initialBatchId);
      } else {
        setTargetType('ALL');
      }
      setTitle('');
      setAmount('');
      setStudentSearch('');
    }
  }, [isOpen, initialStudent, initialBatchId]);

  // Calculate target student count
  let targetCount = 0;
  if (targetType === 'ALL') {
    targetCount = students.length;
  } else if (targetType === 'BATCH') {
    targetCount = selectedBatchId
      ? students.filter((s) => s.batchId === selectedBatchId || s.batch?.id === selectedBatchId).length
      : 0;
  } else if (targetType === 'STUDENT') {
    targetCount = selectedStudentId ? 1 : 0;
  }

  const numAmount = Number(amount) || 0;
  const totalBilled = numAmount * targetCount;

  const searchTokens = studentSearch.toLowerCase().trim().split(/\s+/).filter(Boolean);

  const filteredStudents = searchTokens.length > 0
    ? students.filter((s) => {
        const parts = [
          s.firstName,
          s.lastName,
          `${s.firstName || ''} ${s.lastName || ''}`,
          `${s.lastName || ''} ${s.firstName || ''}`,
          s.studentId,
          s.rollNumber,
          s.email,
          s.phone,
          s.batch?.name,
          s.course?.name,
        ].filter(Boolean).map((str) => String(str).toLowerCase());

        const combinedText = parts.join(' ');
        return searchTokens.every((token) => combinedText.includes(token));
      })
    : students;

  // Auto-select when search results in a single match
  useEffect(() => {
    if (isOpen && targetType === 'STUDENT' && studentSearch.trim() && filteredStudents.length === 1) {
      setSelectedStudentId(filteredStudents[0].id);
    }
  }, [isOpen, studentSearch, filteredStudents, targetType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      error('Validation Error', 'Please enter a fee title or description.');
      return;
    }
    if (numAmount <= 0) {
      error('Validation Error', 'Please enter a valid positive fee amount.');
      return;
    }
    if (targetType === 'BATCH' && !selectedBatchId) {
      error('Validation Error', 'Please select a batch.');
      return;
    }
    if (targetType === 'STUDENT' && !selectedStudentId) {
      error('Validation Error', 'Please select a student.');
      return;
    }
    if (targetCount === 0) {
      error('Validation Error', 'No active students found in the selected target scope.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await paymentApi.assignFee({
        targetType,
        targetId: targetType === 'BATCH' ? selectedBatchId : targetType === 'STUDENT' ? selectedStudentId : undefined,
        title: title.trim(),
        amount: numAmount,
        dueDate,
        category,
      });

      const count = res.data?.data?.assignedCount || targetCount;
      success(
        'Fee Assigned Successfully',
        `Assigned ${title} (${formatCurrency(numAmount)}) to ${count} student(s). Total added: ${formatCurrency(totalBilled)}.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Fee Assignment Failed', err.response?.data?.message || 'Could not assign fee charge.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Assign Fee / Fine Charge
              </h2>
              <p className="text-xs text-slate-500">
                
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Audience Scope */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              1. Target Audience Scope
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTargetType('ALL')}
                className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
                  targetType === 'ALL'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold block">All Students</span>
                <span className="text-[10px] text-slate-400 font-mono">{students.length} Total</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('BATCH')}
                className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
                  targetType === 'BATCH'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="text-xs font-bold block">Specific Batch</span>
                <span className="text-[10px] text-slate-400 font-mono">{batches.length} Batches</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('STUDENT')}
                className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
                  targetType === 'STUDENT'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-xs font-bold block">Single Student</span>
                <span className="text-[10px] text-slate-400 font-mono">1 Target</span>
              </button>
            </div>
          </div>

          {/* Conditional Target Selector */}
          {targetType === 'BATCH' && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Select Batch Batch
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              >
                <option value="">-- Choose a Batch --</option>
                {batches.map((b) => {
                  const bStudents = students.filter((s) => s.batchId === b.id || s.batch?.id === b.id).length;
                  return (
                    <option key={b.id} value={b.id}>
                      {b.name} ({bStudents} students)
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {targetType === 'STUDENT' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Select Student
              </label>
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student by name , roll, or ID..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 mb-1"
              />
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              >
                <option value="">
                  {studentSearch.trim()
                    ? filteredStudents.length === 0
                      ? `No students found matching "${studentSearch}"`
                      : `-- Select Student (${filteredStudents.length} match${filteredStudents.length === 1 ? '' : 'es'}) --`
                    : '-- Select Student --'}
                </option>
                {filteredStudents.slice(0, 100).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.studentId} • {s.batch?.name || 'Unassigned'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fee Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Fee Title / Reason *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="EXAM">Exam / Test</option>
                <option value="FINE">Fine / Penalty</option>
                <option value="MATERIAL">Study Material</option>
                <option value="REGISTRATION">Registration</option>
                <option value="OTHER">Other Misc</option>
              </select>
            </div>
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Fee Amount (₹) Per Student *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
            </div>
          </div>

          {/* Summary Calculation Box */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-blue-900 block">
                Billing Impact: {targetCount} Student{targetCount === 1 ? '' : 's'}
              </span>
              <span className="text-[10px] text-blue-600">
                {numAmount > 0 ? `${formatCurrency(numAmount)} per learner • Due ${formatDate(dueDate)}` : 'Enter fee amount'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Charge</span>
              <span className="text-base font-black text-blue-700 tabular-nums">
                {formatCurrency(totalBilled)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || targetCount === 0 || numAmount <= 0}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              {submitting ? 'Assigning...' : `Assign Fee (${formatCurrency(totalBilled)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
