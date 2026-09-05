import React, { useEffect, useState } from 'react';
import { User, Phone, Mail, MapPin, Calendar, BookOpen, Layers, Shield, Lock, KeyRound } from 'lucide-react';
import { studentApi } from '../../services/api';
import { Student } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
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
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-400">Student profile record not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          My Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100 text-center sm:text-left">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-3xl font-black overflow-hidden flex-shrink-0 shadow-lg shadow-blue-500/20">
            {student.avatarUrl ? (
              <img src={getMediaUrl(student.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              `${student.firstName[0]}${student.lastName[0]}`
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h2 className="text-2xl font-black text-slate-900">
                {student.firstName} {student.lastName}
              </h2>
              <span className="font-mono text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                {student.studentId}
              </span>
              <Badge variant="success">Active Learner</Badge>
            </div>
            <p className="text-sm font-semibold text-blue-600 mt-1">
              Course: {student.course?.name} &bull; Batch: {student.batch?.name || 'Batch'}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Admitted: {formatDate(student.admissionDate)} &bull; Gender: {student.gender}
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Contact & Address
            </h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-blue-500" />
                <span>{student.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-blue-500" />
                <span>{student.email}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{student.address}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Parent & Guardian Particulars
            </h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Guardian Name:</span>
                <span className="font-semibold text-slate-900">{student.guardianName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Relationship:</span>
                <span className="font-semibold text-slate-900">{student.guardianRelation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Guardian Phone:</span>
                <span className="font-semibold text-slate-900">{student.guardianPhone}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Emergency Phone:</span>
                <span className="font-bold text-rose-600">{student.emergencyContact}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Student Account Security & Password */}
        <div className="pt-2 border-t border-slate-100">
          <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 p-5 rounded-2xl border border-blue-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl flex-shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Student Account & Password Security
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
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
