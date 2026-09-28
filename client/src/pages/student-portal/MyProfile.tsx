import React, { useEffect, useState } from 'react';
import { User, Phone, Mail, MapPin, Calendar, BookOpen, Layers, Shield, Lock, KeyRound } from 'lucide-react';
import { studentApi } from '../../services/api';
import { Student } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/date';
import { getMediaUrl } from '../../utils/media';

export const MyProfile: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const fetchProfile = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await studentApi.getMyProfile();
      setStudent(res.data.data);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(true);
    const interval = setInterval(() => {
      fetchProfile(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSkeleton count={4} />;
  if (!student) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <p className="text-slate-400">Student profile record not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="My Profile"
        subtitle="Manage your academic enrolment credentials, contact data, guardian records, and security."
        badge={student.studentId}
      />

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100 dark:border-slate-800 text-center sm:text-left">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-3xl font-black overflow-hidden flex-shrink-0 shadow-lg shadow-blue-500/20 relative">
            <span className="select-none">{`${student.firstName[0]}${student.lastName[0]}`}</span>
            {student.avatarUrl && (
              <img
                src={getMediaUrl(student.avatarUrl)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {student.firstName} {student.lastName}
              </h2>
              <span className="font-mono text-xs font-bold px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                {student.studentId}
              </span>
              <Badge variant="success" size="sm" dot>Active Learner</Badge>
            </div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
              Course: {student.course?.name} &bull; Batch: {student.batch?.name || 'Batch'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">
              Admitted: {formatDate(student.admissionDate)} &bull; Gender: {student.gender}
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Contact & Address
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Phone className="w-4 h-4 text-blue-500" />
                <span>{student.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Mail className="w-4 h-4 text-blue-500" />
                <span>{student.email}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{student.address}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Parent & Guardian Particulars
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Guardian Name:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{student.guardianName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Relationship:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{student.guardianRelation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Guardian Phone:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{student.guardianPhone}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Emergency Phone:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{student.emergencyContact}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Student Account Security & Password */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-blue-50/50 dark:bg-blue-950/30 p-5 rounded-2xl border border-blue-200/70 dark:border-blue-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-xl flex-shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Student Account & Password Security
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Change your student login password to secure your academic profile and submissions.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={Lock}
              onClick={() => setIsPasswordModalOpen(true)}
            >
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Student Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
