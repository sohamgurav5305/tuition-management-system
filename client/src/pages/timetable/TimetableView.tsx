import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  BookOpen,
  PlusCircle,
  Filter,
  Edit,
  Layers,
  GraduationCap,
  Building2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { batchApi } from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { BatchFormModal } from '../batches/BatchFormModal';
import { Batch } from '../../types';

interface TimetableSlot {
  id: string;
  batchId: string;
  batchName: string;
  courseName: string;
  facultyName: string;
  subjectTaught: string;
  classroom: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  studentCount: number;
}

const DAYS = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
];

export const TimetableView: React.FC = () => {
  const [schedule, setSchedule] = useState<TimetableSlot[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('Mon');
  const [classroomFilter, setClassroomFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Modal for admin batch scheduling
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const [ttRes, batchRes] = await Promise.all([
        batchApi.getTimetable(),
        batchApi.getAll('ACTIVE'),
      ]);
      setSchedule(ttRes.data.data);
      setBatches(batchRes.data.data);
    } catch (err) {
      console.error('Failed to load timetable', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  if (loading) return <LoadingSkeleton count={6} />;

  // Unique classrooms in the timetable
  const allClassrooms = Array.from(
    new Set(schedule.map((s) => s.classroom).filter(Boolean))
  );

  // Filter slots active on selected day and matching classroom filter
  let daySlots = schedule.filter((slot) => slot.daysOfWeek.includes(selectedDay));
  if (classroomFilter) {
    daySlots = daySlots.filter((s) => s.classroom === classroomFilter);
  }
  daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Detect time/room conflicts for the selected day
  const detectedConflicts: { [slotId: string]: string } = {};
  for (let i = 0; i < daySlots.length; i++) {
    for (let j = i + 1; j < daySlots.length; j++) {
      const s1 = daySlots[i];
      const s2 = daySlots[j];

      const overlap = s1.startTime < s2.endTime && s2.startTime < s1.endTime;
      if (overlap) {
        if (s1.classroom && s1.classroom === s2.classroom) {
          detectedConflicts[s1.id] = `Room Conflict: ${s1.classroom} double-booked`;
          detectedConflicts[s2.id] = `Room Conflict: ${s2.classroom} double-booked`;
        }
        if (s1.facultyName && s1.facultyName === s2.facultyName) {
          detectedConflicts[s1.id] = `Faculty Conflict: ${s1.facultyName} double-booked`;
          detectedConflicts[s2.id] = `Faculty Conflict: ${s2.facultyName} double-booked`;
        }
      }
    }
  }

  const handleEditSlot = (slot: TimetableSlot) => {
    const matchedBatch = batches.find((b) => b.id === slot.id);
    if (matchedBatch) {
      setEditingBatch(matchedBatch);
      setIsScheduleOpen(true);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <PageHeader
        title="Weekly Timetable & Schedule"
        subtitle="Manage weekly batch schedules, lecture hall reservations, and conflict-free faculty allocations."
        badge={`${schedule.length} Active Slots`}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={PlusCircle}
            onClick={() => {
              setEditingBatch(null);
              setIsScheduleOpen(true);
            }}
          >
            + Allocate Schedule Slot
          </Button>
        }
      />

      {/* Day Selector & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Day Tabs (Monday - Saturday) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {DAYS.map((d) => (
            <button
              key={d.short}
              onClick={() => setSelectedDay(d.short)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedDay === d.short
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              {d.full}
            </button>
          ))}
        </div>

        {/* Classroom Filter */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={classroomFilter}
            onChange={(e) => setClassroomFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="">All Classrooms / Halls</option>
            {allClassrooms.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule Blocks View */}
      {daySlots.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No Classes Scheduled on {DAYS.find((d) => d.short === selectedDay)?.full}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "+ Allocate Schedule Slot" to assign a batch, lecture hall, and subject faculty to this day.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {daySlots.map((slot) => {
            const conflict = detectedConflicts[slot.id];
            return (
              <div
                key={slot.id}
                className={`p-5 rounded-2xl border bg-white dark:bg-[#111827] transition-all space-y-4 shadow-xs relative ${
                  conflict
                    ? 'border-rose-400 dark:border-rose-800/80 ring-1 ring-rose-400/40'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800'
                }`}
              >
                {/* Conflict Alert Banner if any */}
                {conflict && (
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{conflict}</span>
                  </div>
                )}

                {/* Header Timing & Room */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-800/60">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>

                  <Badge variant="neutral" size="xs">
                    {slot.classroom || 'Classroom TBA'}
                  </Badge>
                </div>

                {/* Subject & Batch Info */}
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {slot.subjectTaught || 'Subject Class'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cohort: <strong className="text-slate-800 dark:text-slate-200">{slot.batchName}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Program: {slot.courseName}
                  </p>
                </div>

                {/* Faculty Mentor & Student Count */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium truncate">
                    <GraduationCap className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span className="truncate">{slot.facultyName || 'Specialist Mentor'}</span>
                  </div>

                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">
                    {slot.studentCount || 0} Students
                  </span>
                </div>

                {/* Edit Slot Action */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleEditSlot(slot)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" /> Edit Batch Schedule
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batch Form / Schedule Modal */}
      <BatchFormModal
        isOpen={isScheduleOpen}
        onClose={() => {
          setIsScheduleOpen(false);
          setEditingBatch(null);
        }}
        onSuccess={() => {
          setIsScheduleOpen(false);
          setEditingBatch(null);
          fetchTimetable();
        }}
        initialBatch={editingBatch}
      />
    </div>
  );
};
