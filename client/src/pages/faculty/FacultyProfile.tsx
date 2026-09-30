import React, { useEffect, useState } from 'react';
import { Phone, Mail, Award, Clock, Lock } from 'lucide-react';
import { facultyApi } from '../../services/api';
import { Faculty } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import { formatDate } from '../../utils/date';
import { getMediaUrl } from '../../utils/media';

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
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl mx-auto">
        <p className="text-slate-400 text-xs">Faculty mentor profile record not found.</p>
      </div>
    );
  }

  const initials = `${faculty.firstName?.[0] || 'F'}${faculty.lastName?.[0] || 'M'}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="My Profile"
        actions={
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={Lock}
            onClick={() => setIsPasswordModalOpen(true)}
          >
            Change Password
          </Button>
        }
      />

      {/* Main Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100 dark:border-slate-800 text-center sm:text-left">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black overflow-hidden flex-shrink-0 shadow-lg shadow-purple-500/20 relative">
            <span className="select-none">{initials}</span>
            {faculty.avatarUrl && (
              <img
                src={getMediaUrl(faculty.avatarUrl)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {faculty.firstName} {faculty.lastName}
              </h2>
            </div>
            <p className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-1">
              Department: {faculty.subjectTaught}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {faculty.qualification} &bull; {faculty.experienceYears} Years Experience
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-mono">
              Joined Institute: {formatDate(faculty.joiningDate)}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Contact Particulars
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                <Phone className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="font-medium">{faculty.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                <Mail className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="font-medium">{faculty.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                <Award className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="font-medium">Primary Subject: {faculty.subjectTaught}</span>
              </div>
            </div>
          </div>

          {/* Teaching Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Academic Responsibilities
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Assigned Batches:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {faculty.batches?.length || 0} Batches
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Status:</span>
                <Badge variant="success" size="xs">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">User Account:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                  {faculty.user?.username || 'teacher'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Teaching Batches */}
        {faculty.batches && faculty.batches.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Assigned Batches
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {faculty.batches.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      {b.batchId}
                    </span>
                    <Badge variant="success" size="xs">Active</Badge>
                  </div>
                  <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">{b.name}</h5>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400">
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
