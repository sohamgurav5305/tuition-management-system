import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Clock,
  BookOpen,
  Trophy,
  Award,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { examApi, studentApi, resultApi } from '../../services/api';
import { Examination, Result } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Badge } from '../../components/common/Badge';

export const MyExams: React.FC = () => {
  const [exams, setExams] = useState<Examination[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'GRADED' | 'UPCOMING'>('ALL');

  useEffect(() => {
    const fetchExamsAndResults = async () => {
      try {
        setLoading(true);
        const [profRes, resRes] = await Promise.all([
          studentApi.getMyProfile().catch(() => ({ data: { data: null } })),
          resultApi.getMyResults().catch(() => ({ data: { data: [] } })),
        ]);

        const batchId = profRes.data.data?.batchId;
        const examRes = await examApi.getAll({ batchId });

        setExams(examRes.data.data || []);
        setResults(resRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load my exams and scorecards', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExamsAndResults();
  }, []);

  if (loading) return <LoadingSkeleton count={4} />;

  const resultMap = new Map<string, Result>();
  results.forEach((r) => {
    resultMap.set(r.examId, r);
  });

  const filteredExams = exams.filter((e) => {
    const hasScorecard = resultMap.has(e.id);
    if (filter === 'GRADED') return hasScorecard;
    if (filter === 'UPCOMING') return !hasScorecard && e.status !== 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Exams & Test Series
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Scheduled examinations, syllabus patterns, and evaluated scorecards with All-India Ranks.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm text-xs">
        <span className="text-slate-400 font-bold flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" /> View Filter:
        </span>
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filter === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          All Test Series ({exams.length})
        </button>
        <button
          onClick={() => setFilter('GRADED')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filter === 'GRADED'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          Evaluated Scorecards ({results.length})
        </button>
        <button
          onClick={() => setFilter('UPCOMING')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filter === 'UPCOMING'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          Upcoming Tests
        </button>
      </div>

      {/* Exam & Scorecard List */}
      <div className="space-y-4">
        {filteredExams.length > 0 ? (
          filteredExams.map((e) => {
            const result = resultMap.get(e.id);
            const hasScorecard = !!result;

            return (
              <div
                key={e.id}
                className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-4"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {e.examId}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 rounded font-bold text-[10px]">
                        {e.examPattern}
                      </span>
                      {hasScorecard ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Scorecard Available
                        </span>
                      ) : (
                        <Badge
                          variant={
                            e.status === 'COMPLETED' ? 'neutral' : e.status === 'ONGOING' ? 'warning' : 'info'
                          }
                          size="sm"
                        >
                          {e.status}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {e.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" /> {e.subject}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Exam Date: <strong>{e.examDate}</strong>
                      </span>
                      <span>
                        Total Marks: <strong>{e.totalMarks} pts</strong> ({e.passingMarks} min)
                      </span>
                    </div>
                  </div>

                  {hasScorecard && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs font-black text-amber-700 dark:text-amber-300">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>AIR #{result.batchRank || 1}</span>
                      </div>

                      <span
                        className={`px-3 py-1.5 rounded-2xl text-xs font-black shadow-sm ${
                          result.grade === 'A+' || result.grade === 'A'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : result.grade === 'B+' || result.grade === 'B'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        Grade {result.grade}
                      </span>
                    </div>
                  )}
                </div>

                {/* Scorecard Strip (Inline when available) */}
                {hasScorecard ? (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl text-xs text-center border border-slate-200/60 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 font-semibold">Net Score Obtained</span>
                        <p className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                          {result.marksObtained} <span className="text-xs font-normal text-slate-400">/ {e.totalMarks}</span>
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Calculated Percentile</span>
                        <p className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
                          {result.percentile || 0}%ile
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Negative Penalty</span>
                        <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                          -{result.negativePenalty || 0} pts
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Percentage Score</span>
                        <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {result.percentage}%
                        </p>
                      </div>
                    </div>

                    {result.remarks && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 bg-blue-50/40 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100/60 dark:border-blue-900/40">
                        <span className="font-bold text-blue-900 dark:text-blue-200">Instructor Evaluation Note: </span>
                        {result.remarks}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {e.status === 'COMPLETED'
                        ? 'Examination completed. Scorecard evaluation and AIR rankings in progress.'
                        : 'Official scorecard will be published here upon faculty evaluation.'}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-semibold">No test series found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
