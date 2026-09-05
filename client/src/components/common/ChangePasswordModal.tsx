import React, { useState } from 'react';
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../services/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setErrorMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('New password cannot be identical to your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      success('Password Updated', 'Your account password has been changed successfully.');
      handleClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to change password.';
      setErrorMessage(msg);
      toastError('Password Change Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const isMinLength = newPassword.length >= 6;
  const isDifferent = newPassword.length > 0 && newPassword !== currentPassword;
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;

  const roleLabel =
    user?.role === 'ADMINISTRATOR'
      ? 'Administrator'
      : user?.role === 'TEACHER'
      ? 'Faculty Mentor'
      : user?.role === 'STUDENT'
      ? 'Student'
      : user?.role === 'ACCOUNTANT'
      ? 'Accountant'
      : user?.role || 'User';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Account Password"
      subtitle={`Update login credentials for ${user?.username || 'User'} (${roleLabel})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Security Banner */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-950">
              Enhanced Account Security
            </p>
            <p className="text-[11px] text-blue-700">
              Ensure your new password contains at least 6 characters.
            </p>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Current Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Current Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type={showCurrent ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            New Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
              className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Confirm New Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Password Strength Validation Rules */}
        {newPassword && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
            <div
              className={`flex items-center gap-1.5 ${
                isMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isMinLength ? 'text-emerald-500' : 'text-slate-300'}`} />
              <span>At least 6 characters long</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${
                isDifferent ? 'text-emerald-600 font-semibold' : 'text-slate-400'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isDifferent ? 'text-emerald-500' : 'text-slate-300'}`} />
              <span>Different from current password</span>
            </div>
            {confirmPassword && (
              <div
                className={`flex items-center gap-1.5 ${
                  isMatching ? 'text-emerald-600 font-semibold' : 'text-rose-500'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${isMatching ? 'text-emerald-500' : 'text-rose-400'}`} />
                <span>{isMatching ? 'Passwords match' : 'Passwords do not match yet'}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" size="sm" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={loading}>
            {loading ? 'Updating Password...' : 'Save New Password'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
