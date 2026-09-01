import React from 'react';
import { Users, Clock, MapPin, GraduationCap, Calendar, BookOpen, Phone, Mail } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Batch } from '../../types';

interface BatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
}

export const BatchDetailModal: React.FC<BatchDetailModalProps> = ({
  isOpen,
  onClose,
  batch,
}) => {
  if (!batch) return null;

  let days: string[] = [];
  try {
    days = typeof batch.daysOfWeek === 'string' ? JSON.parse(batch.daysOfWeek) : batch.daysOfWeek;
  } catch {
    days = [];
  }

  const students = batch.students || [];

  // Resolve all subject instructors
  const instructors = batch.subjectInstructors && batch.subjectInstructors.length > 0
    ? batch.subjectInstructors
    : batch.faculty
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${batch.name} (${batch.batchId})`}
      subtitle={`Academic Program: ${batch.course?.name || 'Custom Curriculum'}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Schedule & Classroom Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block mb-1">Classroom & Timing:</span>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-500" />
              {batch.classroom}
            </p>
            <p className="text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              {batch.startTime} - {batch.endTime}
            </p>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block mb-1">Meeting Days & Cohort Duration:</span>
            <div className="flex flex-wrap gap-1 mt-1 mb-2">
              {days.map((d) => (
                <span
                  key={d}
                  className="px-2 py-0.5 text-[10px] font-bold bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {d}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Period: {batch.startDate} to {batch.endDate}
            </p>
          </div>
        </div>

        {/* Assigned Subject Instructors (ALL INSTRUCTORS DISPLAYED) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              Assigned Faculty Instructors ({instructors.length} Specialists)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {instructors.map((inst, index) => (
              <div
                key={`${inst.facultyId}-${inst.subject}-${index}`}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-900/50 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                    <BookOpen className="w-3 h-3" /> {inst.subject}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {inst.facultyName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Specialist: {inst.subjectTaught}
                  </p>
                </div>

                {(inst.phone || inst.email) && (
                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-0.5 text-[11px] text-slate-500">
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

        {/* Student Roster */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              Enrolled Student Roster ({students.length} Students)
            </h4>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Student ID</th>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Contact Phone</th>
                  <th className="px-4 py-2.5">Parent Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.length > 0 ? (
                  students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-mono font-bold text-blue-600">{s.studentId}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{s.phone}</td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {s.guardianName} ({s.guardianPhone})
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No students enrolled in this batch yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold rounded-xl"
          >
            Close Roster
          </button>
        </div>
      </div>
    </Modal>
  );
};
