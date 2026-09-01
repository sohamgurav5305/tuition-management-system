import React, { useEffect, useState } from 'react';
import { Layers, Clock, MapPin, User, BookOpen, Calendar, GraduationCap, Phone, Mail } from 'lucide-react';
import { studentApi } from '../../services/api';
import { Student } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const MyBatch: React.FC = () => {
  const [profile, setProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const res = await studentApi.getMyProfile();
        setProfile(res.data.data);
      } catch (err) {
        console.error('Failed to load student batch', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBatch();
  }, []);

  if (loading) return <LoadingSkeleton count={4} />;

  const batch = profile?.batch;
  const course = profile?.course;

  let days: string[] = [];
  if (batch?.daysOfWeek) {
    try {
      days = typeof batch.daysOfWeek === 'string' ? JSON.parse(batch.daysOfWeek) : batch.daysOfWeek;
    } catch {
      days = [];
    }
  }

  // Resolve all subject instructors
  const instructors = batch?.subjectInstructors && batch.subjectInstructors.length > 0
    ? batch.subjectInstructors
    : batch?.faculty
    ? [
        {
          subject: batch.faculty.subjectTaught || 'Primary Subject',
          facultyId: batch.faculty.id,
          facultyName: `${batch.faculty.firstName} ${batch.faculty.lastName}`,
          subjectTaught: batch.faculty.subjectTaught,
          phone: batch.faculty.phone,
          email: batch.faculty.email,
        },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          My Cohort & Class Schedule
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Detailed timetable, classroom room assignment, and all subject specialist faculty for your batch.
        </p>
      </div>

      {batch ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
            <div>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {batch.batchId}
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {batch.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" /> {course?.name} ({course?.duration})
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-full w-fit">
              Active Cohort
            </span>
          </div>

          {/* Classroom & Timing + Meeting Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Classroom & Timing
              </span>
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Classroom: {batch.classroom}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{batch.startTime} - {batch.endTime}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Weekly Meeting Days
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {days.map((d) => (
                  <span
                    key={d}
                    className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800/60"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Assigned Subject Instructors (ALL INSTRUCTORS DISPLAYED) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              Batch Faculty & Subject Specialists ({instructors.length} Instructors)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {instructors.map((inst, index) => (
                <div
                  key={`${inst.facultyId}-${inst.subject}-${index}`}
                  className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-purple-100 dark:border-purple-900/40 space-y-2"
                >
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                    <BookOpen className="w-3 h-3" /> {inst.subject}
                  </span>

                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {inst.facultyName}
                    </p>
                    <p className="text-xs text-slate-400">
                      Specialist: {inst.subjectTaught}
                    </p>
                  </div>

                  {(inst.phone || inst.email) && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-0.5 text-[11px] text-slate-500">
                      {inst.phone && (
                        <p className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {inst.phone}
                        </p>
                      )}
                      {inst.email && (
                        <p className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-slate-400" /> {inst.email}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Cohort Period: {batch.startDate} to {batch.endDate}</span>
            <span>Status: Active Session</span>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <p className="text-slate-400 text-sm">You are not currently assigned to a batch. Please contact the front desk.</p>
        </div>
      )}
    </div>
  );
};
