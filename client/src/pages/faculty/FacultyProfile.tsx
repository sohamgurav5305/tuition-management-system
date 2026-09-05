import React, { useEffect, useState } from 'react';
import { User, Phone, Mail, Award, BookOpen, Layers, Calendar, Clock, MapPin, CheckCircle2, Lock, KeyRound, ShieldCheck } from 'lucide-react';
import { facultyApi } from '../../services/api';
import { Faculty } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import { formatDate } from '../../utils/date';

export const FacultyProfile: React.FC = () => {
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const fetchProfile = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await facultyApi.getMyProfile();
      setFaculty(res.data.data);
    } catch (err) {
      console.error('Failed to load faculty profile', err);
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
  if (!faculty) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-4xl mx-auto">
        <p className="text-slate-400 text-xs">Faculty mentor profile record not found.</p>
      </div>
    );
  }

  const initials = `${faculty.firstName?.[0] || 'F'}${faculty.lastName?.[0] || 'M'}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          My Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          
        </p>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100 text-center sm:text-left">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black overflow-hidden flex-shrink-0 shadow-lg shadow-purple-500/20">
            {faculty.avatarUrl ? (
              <img src={faculty.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h2 className="text-2xl font-black text-slate-900">
                {faculty.firstName} {faculty.lastName}
              </h2>
              <span className="font-mono text-xs font-bold px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                {faculty.facultyId}
              </span>
              <Badge variant="success">Active Faculty Specialist</Badge>
            </div>
            <p className="text-sm font-bold text-purple-600 mt-1">
              Department: {faculty.subjectTaught}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {faculty.qualification} &bull; {faculty.experienceYears} Years Experience
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
              Joined Institute: {formatDate(faculty.joiningDate)}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Contact Particulars
            </h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="font-medium">{faculty.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="font-medium">{faculty.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Award className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="font-medium">Primary Subject: {faculty.subjectTaught}</span>
              </div>
            </div>
          </div>

          {/* Teaching Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Academic Responsibilities
            </h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Batches:</span>
                <span className="font-bold text-slate-900">
                  {faculty.batches?.length || 0} Batches
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge variant="success" size="xs">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">User Account:</span>
                <span className="font-mono text-slate-700 font-bold">
                  {faculty.user?.username || 'teacher'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Security & Password Management */}
        <div className="pt-2 border-t border-slate-100">
          <div className="bg-gradient-to-r from-purple-50/70 to-indigo-50/70 p-5 rounded-2xl border border-purple-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl flex-shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Account Credentials & Password Security
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Update your faculty portal password and protect your educator account.
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

        {/* Assigned Teaching Batches */}
        {faculty.batches && faculty.batches.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Assigned Batches
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {faculty.batches.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                      {b.batchId}
                    </span>
                    <Badge variant="success" size="xs">Active</Badge>
                  </div>
                  <h5 className="font-bold text-xs text-slate-900">{b.name}</h5>
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" /> {b.startTime} - {b.endTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
