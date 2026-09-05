import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Building2,
  Save,
  Download,
  Shield,
  CheckCircle2,
  Cloud,
  Calendar,
  User,
  Bell,
  Sliders,
  Lock,
  KeyRound,
} from 'lucide-react';
import { settingApi } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';

interface SettingsFormValues {
  instituteName: string;
  currencySymbol: string;
  currencyCode: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  academicYear: string;
  website: string;
}

export const SettingsPage: React.FC = () => {
  const { settings, refreshSettings } = useSettings();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'account' | 'notifications' | 'system'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<SettingsFormValues>({
    defaultValues: settings,
  });

  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const onSubmit = async (values: SettingsFormValues) => {
    setIsSaving(true);
    try {
      await settingApi.updateSettings(values);
      await refreshSettings();
      success('Settings Updated', 'Institute configuration profile saved successfully.');
    } catch (err: any) {
      error('Save Failed', err.response?.data?.message || 'Could not update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <PageHeader
        title="Settings & System Preferences"
        subtitle=""
        badge="Master Control"
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200/80 pb-2">
        {[
          { id: 'profile', label: 'Institute Profile', icon: Building2 },
          { id: 'academic', label: 'Academic Year', icon: Calendar },
          { id: 'account', label: 'Admin Account', icon: User },
          { id: 'notifications', label: 'Notification Preferences', icon: Bell },
          { id: 'system', label: 'System Preferences', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tab 1: Institute Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Institute Branding & Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institute / Coaching Brand Name
                </label>
                <input
                  {...register('instituteName')}
                  type="text"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Contact Phone
                </label>
                <input
                  {...register('contactPhone')}
                  type="text"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <input
                  {...register('contactEmail')}
                  type="email"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campus Address (Printed on Invoices & Receipts)
                </label>
                <textarea
                  {...register('address')}
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Website URL
                </label>
                <input
                  {...register('website')}
                  type="text"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-semibold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Academic Year */}
        {activeTab === 'academic' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Academic Year & Currency Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Academic Year
                </label>
                <input
                  {...register('academicYear')}
                  type="text"
                  placeholder="2026-2027"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Currency Symbol
                </label>
                <input
                  {...register('currencySymbol')}
                  type="text"
                  placeholder="₹"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Currency Code
                </label>
                <input
                  {...register('currencyCode')}
                  type="text"
                  placeholder="INR"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-semibold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Admin Account */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Administrator Master Credentials
              </h3>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Superadmin Email Identifier
                  </label>
                  <input
                    type="text"
                    disabled
                    value="admin@tuition.edu"
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Master Role Access
                  </label>
                  <input
                    type="text"
                    disabled
                    value="ADMINISTRATOR (Full Master Access)"
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Password & Security Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-blue-500" />
                  Administrator Account Password
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Update your administrator account password and security credentials.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={Lock}
                onClick={() => setIsPasswordModalOpen(true)}
              >
                Change Admin Password
              </Button>
            </div>
          </div>
        )}

        {/* Tab 4: Notification Preferences */}
        {activeTab === 'notifications' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Automated Notification Triggers
            </h3>

            <div className="space-y-3">
              {[
                {
                  title: 'Daily Absent Student Alerts',
                  desc: 'Notify guardians when a student is marked absent in daily Attendance.',
                },
                {
                  title: 'Fee Installment Due Date Reminders',
                  desc: 'Broadcast payment reminder notice 3 days prior to installment due date.',
                },
                {
                  title: 'Assignment & DPP Publishing Alerts',
                  desc: 'Notify students instantly when faculty uploads new problem sets or study materials.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: System Preferences */}
        {activeTab === 'system' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Database Connectivity & Data Backup
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Neon Cloud PostgreSQL Database
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Active cloud connection established &bull; Scalable serverless database
                  </p>
                </div>
              </div>
              <Badge variant="success" size="xs" dot>
                Online
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Export System JSON Snapshot
                </h4>
                <p className="text-[11px] text-slate-500">
                  Export all students, batches, faculty rosters, and fee receipts to a standalone backup file.
                </p>
              </div>
              <a href={settingApi.backupUrl} download>
                <Button variant="secondary" size="sm" leftIcon={Download}>
                  Download JSON Backup
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Save Button for Profile & Academic tabs */}
        {(activeTab === 'profile' || activeTab === 'academic') && (
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={Save}
              isLoading={isSaving}
            >
              Save Institute Settings
            </Button>
          </div>
        )}
      </form>

      {/* Administrator Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
