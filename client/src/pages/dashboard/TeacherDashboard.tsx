import React, { useEffect, useState } from 'react';
import { Layers, CalendarCheck, FileText, FileSpreadsheet, ArrowRight, Clock, MapPin, GraduationCap, BookOpen, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/common/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { batchApi, assignmentApi, examApi, facultyApi } from '../../services/api';
import { Batch, Assignment, Examination, Faculty } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [facultyProfile, setFacultyProfile] = useState<Faculty | null>(user?.faculty || null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        const [profRes, batchRes, assignRes, examRes] = await Promise.all([
          facultyApi.getMyProfile().catch(() => ({ data: { data: null } })),
          batchApi.getAll({ status: 'ACTIVE' }),
          assignmentApi.getAll({ status: 'OPEN' }),
          examApi.getAll({ status: 'UPCOMING' }),
        ]);

        if (profRes.data?.data) {
          setFacultyProfile(profRes.data.data);
        }
        setBatches(batchRes.data.data.slice(0, 6));
        setAssignments(assignRes.data.data.slice(0, 4));
        setExams(examRes.data.data.slice(0, 4));
      } catch (err) {
        console.error('Teacher dashboard error', err);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherData();
  }, []);

  if (loading) return <LoadingSkeleton count={6} />;

  const facultyName = facultyProfile
    ? `${facultyProfile.firstName} ${facultyProfile.lastName}`
    : user?.faculty
    ? `${user.faculty.firstName} ${user.faculty.lastName}`
    : 'Faculty Mentor';

  const subjectName = facultyProfile?.subjectTaught || user?.faculty?.subjectTaught || 'Academic Faculty';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <PageHeader
        title={`Welcome, ${facultyName}`}
        subtitle={`${facultyProfile?.qualification ? `${facultyProfile.qualification} • ` : ''}Manage your teaching batches, record daily rollcall attendance, and enter student exam grades.`}
        badge={`${subjectName} Specialist`}
        actions={
          <>
            <Link to="/attendance">
              <Button variant="primary" size="sm" leftIcon={CalendarCheck}>
                Mark Attendance
              </Button>
            </Link>
            <Link to="/results">
              <Button variant="secondary" size="sm" leftIcon={FileSpreadsheet}>
                Enter Marks
              </Button>
            </Link>
          </>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Active Batches"
          value={batches.length}
          subtitle="Assigned classrooms"
          icon={Layers}
          colorScheme="blue"
        />
        <StatCard
          title="Open Assignments"
          value={assignments.length}
          subtitle="Pending submissions"
          icon={FileText}
          colorScheme="purple"
        />
        <StatCard
          title="Scheduled Exams"
          value={exams.length}
          subtitle="Upcoming evaluations"
          icon={FileSpreadsheet}
          colorScheme="emerald"
        />
        <StatCard
          title="Daily Rollcall"
          value="Session Ready"
          subtitle="Take today's attendance"
          icon={CalendarCheck}
          colorScheme="amber"
          onClick={() => window.location.href = '/attendance'}
        />
      </div>

      {/* Assigned Batches List */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Assigned Cohorts & Classrooms
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Weekly timetable schedule and classroom venue allocations
            </p>
          </div>
          <Link
            to="/teacher/batches"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            All batches <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {batches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-blue-500/40 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {b.batchId}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {b._count?.students || 0} Students
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">{b.name}</h3>
                  <p className="text-[11px] text-slate-500 truncate">{b.course?.name}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> {b.classroom}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" /> {b.startTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              No Batches Assigned Yet (Day 1 Session)
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Your profile is registered as an active mentor. The Administrator will allocate teaching batches to your profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
