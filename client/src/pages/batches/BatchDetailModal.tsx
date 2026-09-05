import React from 'react';
import { Users, Clock, MapPin, GraduationCap, Calendar, BookOpen, Phone, Mail } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Batch } from '../../types';
import { formatDate } from '../../utils/date';

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
      subtitle={`Course: ${batch.course?.name || 'Custom Curriculum'}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Schedule & Timing Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block mb-1">Lecture Timing:</span>
            <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              {batch.startTime} - {batch.endTime}
            </p>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block mb-1">Meeting Days & Duration:</span>
            <div className="flex flex-wrap gap-1 mt-1 mb-2">
              {days.map((d) => (
                <span
                  key={d}
                  className="px-2 py-0.5 text-[10px] font-bold bg-white rounded border border-slate-200 text-slate-700"
                >
                  {d}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Period: {formatDate(batch.startDate)} to {formatDate(batch.endDate)}
            </p>
          </div>
        </div>

        {/* Assigned Subject Instructors (ALL INSTRUCTORS DISPLAYED) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              Assigned Faculty Instructors ({instructors.length} Specialists)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {instructors.map((inst, index) => (
              <div
                key={`${inst.facultyId}-${inst.subject}-${index}`}
                className="p-3.5 rounded-2xl bg-white border border-purple-200/80 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-100 text-purple-800">
                    <BookOpen className="w-3 h-3" /> {inst.subject}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {inst.facultyName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Specialist: {inst.subjectTaught}
                  </p>
                </div>

                {(inst.phone || inst.email) && (
                  <div className="pt-1.5 border-t border-slate-100 space-y-0.5 text-[11px] text-slate-500">
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
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              Enrolled Student Roster ({students.length} Students)
            </h4>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Student ID</th>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Contact Phone</th>
                  <th className="px-4 py-2.5">Parent Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length > 0 ? (
                  students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-mono font-bold text-blue-600">{s.studentId}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{s.phone}</td>
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

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl"
          >
            Close Roster
          </button>
        </div>
      </div>
    </Modal>
  );
};
