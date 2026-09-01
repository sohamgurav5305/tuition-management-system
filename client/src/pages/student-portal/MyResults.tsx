import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, XCircle, BookOpen, Trophy, Medal } from 'lucide-react';
import { resultApi } from '../../services/api';
import { Result } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Badge } from '../../components/common/Badge';

export const MyResults: React.FC = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await resultApi.getMyResults();
        setResults(res.data.data);
      } catch (err) {
        console.error('Failed to load my results', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) return <LoadingSkeleton count={4} />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          My Test Series Scorecards & AIR Ranks
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Official test series evaluation, negative marking penalties, calculated percentiles, and batch/institute rank standings.
        </p>
      </div>

      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((r) => (
            <div
              key={r.id}
              className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      {r.resultId}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 rounded font-bold text-[10px]">
                      {r.exam?.examPattern || 'JEE_MAIN'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {r.exam?.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{r.exam?.subject}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs font-black text-amber-700 dark:text-amber-300">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>AIR #{r.batchRank || 1}</span>
                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-2xl text-xs font-black shadow-sm ${
                      r.grade === 'A+' || r.grade === 'A'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : r.grade === 'B+' || r.grade === 'B'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    Grade {r.grade}
                  </span>
                </div>
              </div>

              {/* Score Breakdown Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl text-xs text-center">
                <div>
                  <span className="text-slate-400">Net Score</span>
                  <p className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                    {r.marksObtained} / {r.exam?.totalMarks || 100}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Percentile</span>
                  <p className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {r.percentile || 0}%ile
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Negative Penalty</span>
                  <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    -{r.negativePenalty || 0} pts
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Percentage</span>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {r.percentage}%
                  </p>
                </div>
              </div>

              {r.remarks && (
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-blue-50/40 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-100/60 dark:border-blue-900/40">
                  <span className="font-bold text-blue-900 dark:text-blue-200">Mentor Remarks: </span>
                  {r.remarks}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <p className="text-slate-400 text-sm">No examination results published yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
