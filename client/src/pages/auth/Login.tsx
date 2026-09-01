import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Layers,
  CalendarCheck,
  CreditCard,
  Building,
  GraduationCap,
  Users,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const { settings } = useSettings();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: 'admin@tuition.edu',
      password: 'Admin@123',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await login(values.identifier, values.password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid credentials';
      error('Authentication Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (id: string, pass: string) => {
    setValue('identifier', id);
    setValue('password', pass);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 px-4">
        {/* Brand Crest */}
        <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20 mb-3">
          <Shield className="w-6 h-6" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
          {settings.instituteName || 'Apex Career Institute'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Institute Management Portal &bull; Session {settings.academicYear || '2026-2027'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-[#111726] border border-slate-800/80 py-6 px-5 sm:px-8 shadow-2xl rounded-2xl space-y-5">
          {/* Quick Demo Credentials Bar */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              1-Click Fast Login / Demo Accounts
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin', 'Admin@123')}
                className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/60 hover:bg-blue-900/60 text-left transition-colors flex items-center gap-2 group"
              >
                <div className="p-1.5 rounded-lg bg-blue-600 text-white font-bold text-[10px]">
                  ADM
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-blue-300 block truncate group-hover:text-blue-200">
                    Administrator
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono truncate">admin / Admin@123</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('accountant', 'Accountant@123')}
                className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/60 text-left transition-colors flex items-center gap-2 group"
              >
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px]">
                  ACC
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-emerald-300 block truncate group-hover:text-emerald-200">
                    Accountant
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono truncate">accountant / Accountant@123</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('teacher', 'Teacher@123')}
                className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 hover:bg-purple-900/60 text-left transition-colors flex items-center gap-2 group"
              >
                <div className="p-1.5 rounded-lg bg-purple-600 text-white font-bold text-[10px]">
                  FAC
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-purple-300 block truncate group-hover:text-purple-200">
                    Faculty / Teacher
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono truncate">teacher / Teacher@123</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('student', 'Student@123')}
                className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/60 text-left transition-colors flex items-center gap-2 group"
              >
                <div className="p-1.5 rounded-lg bg-amber-600 text-white font-bold text-[10px]">
                  STU
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-amber-300 block truncate group-hover:text-amber-200">
                    Student (Aarav)
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono truncate">student / Student@123</span>
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-2 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Or Sign In With Username
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email / Username */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">
                Email or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  {...register('identifier')}
                  type="text"
                  placeholder="admin@tuition.edu or username"
                  className="w-full pl-9.5 pr-3 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
                />
              </div>
              {errors.identifier && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className="w-full pl-9.5 pr-10 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center"
                rightIcon={ArrowRight}
                isLoading={isSubmitting}
              >
                Sign In
              </Button>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-500 mt-5 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          Encrypted Authentication &bull; Neon Cloud Database
        </p>
      </div>
    </div>
  );
};
