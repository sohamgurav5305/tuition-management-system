import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, Save, CheckCircle2, XCircle, Trophy, Sparkles } from 'lucide-react';
import { examApi, resultApi } from '../../services/api';
import { Examination, Result } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';

interface StudentScoreEntry {
  studentId: string;
  studentCustomId: string;
  name: string;
  rawMarks: number | string;
  negativePenalty: number | string;
  netMarks: number;
  percentage: number;
  percentile: number;
  rank: number;
  grade: string;
  isPassed: boolean;
  remarks: string;
}

export const ResultsEntry: React.FC = () => {
  const { success, error } = useToast();
  const [searchParams] = useSearchParams();

  const [exams, setExams] = useState<Examination[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(searchParams.get('examId') || '');
  const [examDetails, setExamDetails] = useState<any>(null);
  const [scores, setScores] = useState<StudentScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadExams = async () => {
      try {
        const res = await examApi.getAll();
        const list = res.data.data;
        setExams(list);
        if (!selectedExamId && list.length > 0) {
          setSelectedExamId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load exams', err);
      } finally {
        setLoading(false);
      }
    };
    loadExams();
  }, []);

  const calculateGrade = (netMarks: number, total: number, pass: number) => {
    const pct = total > 0 ? Number(((netMarks / total) * 100).toFixed(1)) : 0;
    let grade = 'D';
    if (pct >= 90) grade = 'A+';
    else if (pct >= 80) grade = 'A';
    else if (pct >= 70) grade = 'B+';
    else if (pct >= 60) grade = 'B';
    else if (pct >= 50) grade = 'C';
    else grade = 'D';
    return { percentage: pct, grade, isPassed: netMarks >= pass };
  };

  const recomputeRanks = (list: StudentScoreEntry[], totalMarks: number, passingMarks: number) => {
    const evaluated = list.map((s) => {
      const raw = Number(s.rawMarks) || 0;
      const pen = Number(s.negativePenalty) || 0;
      const net = Math.max(0, raw - pen);
      const calc = calculateGrade(net, totalMarks, passingMarks);
      return {
        ...s,
        netMarks: net,
        percentage: calc.percentage,
        grade: calc.grade,
        isPassed: calc.isPassed,
      };
    });

    evaluated.sort((a, b) => b.netMarks - a.netMarks);

    const totalStudents = evaluated.length;
    return evaluated.map((s, idx) => ({
      ...s,
      rank: idx + 1,
      percentile: totalStudents > 1
        ? Number((100 - (idx / totalStudents) * 100).toFixed(2))
        : 100.0,
    }));
  };

  const fetchExamScores = async () => {
    if (!selectedExamId) return;
    try {
      setLoading(true);
      const res = await resultApi.getByExam(selectedExamId);
      const { exam, results } = res.data.data;
      setExamDetails(exam);

      const mapped: StudentScoreEntry[] = results.map((r: any) => {
        const raw = r.marksObtained ?? 0;
        const pen = 0;
        const net = Math.max(0, raw - pen);
        const calc = calculateGrade(net, exam.totalMarks, exam.passingMarks);

        return {
          studentId: r.studentId,
          studentCustomId: r.student?.studentId || 'STU-000',
          name: `${r.student?.firstName || ''} ${r.student?.lastName || ''}`,
          rawMarks: raw,
          negativePenalty: pen,
          netMarks: net,
          percentage: r.percentage ?? calc.percentage,
          percentile: r.percentile ?? 100.0,
          rank: r.rank ?? 1,
          grade: r.grade ?? calc.grade,
          isPassed: r.isPassed ?? calc.isPassed,
          remarks: r.remarks || '',
        };
      });

      setScores(recomputeRanks(mapped, exam.totalMarks, exam.passingMarks));
    } catch (err: any) {
      error('Error', err.response?.data?.message || 'Failed to fetch exam score roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchExamScores();
    }
  }, [selectedExamId]);

  const handleRawMarkChange = (studentId: string, val: string) => {
    if (!examDetails) return;
    const updated = scores.map((s) => (s.studentId === studentId ? { ...s, rawMarks: val } : s));
    setScores(recomputeRanks(updated, examDetails.totalMarks, examDetails.passingMarks));
  };

  const handlePenaltyChange = (studentId: string, val: string) => {
    if (!examDetails) return;
    const updated = scores.map((s) => (s.studentId === studentId ? { ...s, negativePenalty: val } : s));
    setScores(recomputeRanks(updated, examDetails.totalMarks, examDetails.passingMarks));
  };

  const handleRemarkChange = (studentId: string, val: string) => {
    setScores((prev) => prev.map((s) => (s.studentId === studentId ? { ...s, remarks: val } : s)));
  };

  const handleSaveResults = async () => {
    if (!selectedExamId || !examDetails) return;
    setSaving(true);
    try {
      await resultApi.submitResults({
        examId: selectedExamId,
        entries: scores.map((s) => ({
          studentId: s.studentId,
          marksObtained: s.netMarks,
          totalMarks: examDetails.totalMarks,
          percentage: s.percentage,
          percentile: s.percentile,
          rank: s.rank,
          grade: s.grade,
          isPassed: s.isPassed,
          remarks: s.remarks,
        })),
      });
      success('Scorecards Saved', 'Student test scores and AIR ranks submitted');
      fetchExamScores();
    } catch (err: any) {
      error('Save Failed', err.response?.data?.message || 'Could not save student marks');
    } finally {
      setSaving(false);
    }
  };

  const topRankers = scores.slice(0, 3).filter((s) => Number(s.rawMarks) > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <PageHeader
        title="AIR Results & Scorecards Entry"
        subtitle="Record student marks, apply negative marking penalties, and auto-compute percentiles and All-India ranks."
        badge={examDetails?.examPattern || 'JEE Pattern'}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={Save}
            isLoading={saving}
            onClick={handleSaveResults}
            disabled={scores.length === 0}
          >
            Save All Scorecards
          </Button>
        }
      />

      {/* Select Exam Control */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Select Examination
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.subject}) - {ex.examDate}
                </option>
              ))}
            </select>
          </div>

          {examDetails && (
            <div className="flex items-center gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500">Total Marks:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 ml-1 tabular-nums">{examDetails.totalMarks} pts</span>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Cutoff:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 ml-1 tabular-nums">{examDetails.passingMarks} pts</span>
              </div>
            </div>
          )}
        </div>

        {/* Top 3 Rankers Leaderboard */}
        {topRankers.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Cohort Top Rankers</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {topRankers.map((r, idx) => (
                <div
                  key={r.studentId}
                  className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{r.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{r.studentCustomId}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-2">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{r.netMarks} pts</span>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tabular-nums">{r.percentile}%ile</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Marks Table */}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : scores.length > 0 ? (
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Rank</th>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5 w-24">Raw (+)</th>
                  <th className="px-5 py-3.5 w-20">Penalty (-)</th>
                  <th className="px-5 py-3.5">Net Score</th>
                  <th className="px-5 py-3.5">Percentile</th>
                  <th className="px-5 py-3.5">Grade</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {scores.map((s) => (
                  <tr key={s.studentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      #{s.rank}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{s.name}</p>
                      <span className="font-mono text-blue-600 dark:text-blue-400 text-[11px]">{s.studentCustomId}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        type="number"
                        step="any"
                        value={s.rawMarks}
                        onChange={(e) => handleRawMarkChange(s.studentId, e.target.value)}
                        className="w-18 px-2 py-1 font-bold rounded-lg border text-xs text-center bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        type="number"
                        step="any"
                        value={s.negativePenalty}
                        onChange={(e) => handlePenaltyChange(s.studentId, e.target.value)}
                        placeholder="0"
                        className="w-14 px-2 py-1 font-bold rounded-lg border text-xs text-center bg-rose-50/40 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600"
                      />
                    </td>
                    <td className="px-5 py-3.5 font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {s.netMarks} pts
                    </td>
                    <td className="px-5 py-3.5 font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {s.percentile}%ile
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="purple" size="xs">{s.grade}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      {s.isPassed ? (
                        <Badge variant="success" size="xs" dot>Qualified</Badge>
                      ) : (
                        <Badge variant="danger" size="xs" dot>Below Cutoff</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        value={s.remarks}
                        onChange={(e) => handleRemarkChange(s.studentId, e.target.value)}
                        placeholder="Mentor remarks..."
                        className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-xs">No enrolled students found in this exam cohort.</p>
        </div>
      )}
    </div>
  );
};
