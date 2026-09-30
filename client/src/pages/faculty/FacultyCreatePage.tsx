import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Upload,
  User,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Calendar,
  DollarSign,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
} from 'lucide-react';
import { facultyApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { getMediaUrl } from '../../utils/media';
import { Faculty } from '../../types';

const facultySchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email address is required'),
  subjectTaught: z.string().min(1, 'Subject specialization is required'),
  qualification: z.string().min(1, 'Educational qualification is required'),
  experienceYears: z.coerce.number().min(0, 'Experience must be non-negative'),
  salary: z.coerce.number().min(0, 'Salary must be non-negative'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

type FacultyFormValues = z.infer<typeof facultySchema>;

export const FacultyCreatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { formatCurrency } = useSettings();

  const [loading, setLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingFaculty, setExistingFaculty] = useState<Faculty | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await facultyApi.delete(id);
      success('Faculty Removed', 'Faculty member removed successfully');
      navigate('/faculty');
    } catch (err: any) {
      toastError('Cannot Delete Faculty', err.response?.data?.message || 'Deletion failed');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FacultyFormValues>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      subjectTaught: '',
      qualification: '',
      experienceYears: 0,
      salary: 0,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
    },
  });

  // Fetch faculty details if in edit mode
  useEffect(() => {
    if (!id) return;

    const fetchFacultyData = async () => {
      setLoading(true);
      try {
        const res = await facultyApi.getById(id);
        const data = res.data?.data;
        if (data) {
          setExistingFaculty(data);
          reset({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            email: data.email || '',
            subjectTaught: data.subjectTaught || '',
            qualification: data.qualification || '',
            experienceYears: data.experienceYears || 0,
            salary: data.salary || 0,
            joiningDate: data.joiningDate
              ? new Date(data.joiningDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            status: (data.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
          });
          if (data.avatarUrl) {
            setPreviewUrl(getMediaUrl(data.avatarUrl));
          }
        } else {
          toastError('Faculty Not Found', 'Could not locate the requested faculty member');
          navigate('/faculty');
        }
      } catch (err: any) {
        console.error('Failed to load faculty record', err);
        toastError('Failed to Load', err.message || 'Could not load faculty details');
        navigate('/faculty');
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, [id, reset, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const onSubmit = async (values: FacultyFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, String(val));
        }
      });

      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }

      if (isEditMode && id) {
        await facultyApi.update(id, formData);
        success('Faculty Updated', `${values.firstName} ${values.lastName}'s record updated successfully`);
      } else {
        await facultyApi.create(formData);
        success('Faculty Registered', `New faculty member ${values.firstName} ${values.lastName} added successfully`);
      }

      navigate('/faculty');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save faculty record';
      toastError('Registration Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-6">
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Top Navigation Header */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/faculty')}
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          Back to Faculty Roster
        </Button>
      </div>

      {/* Main Page Title Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {isEditMode ? `Edit Faculty Record` : `Add New Faculty Member`}
            </h1>
          </div>

          {existingFaculty?.facultyId && (
            <div className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs self-start sm:self-auto">
              ID: {existingFaculty.facultyId}
            </div>
          )}
        </div>
      </div>

      {/* Faculty Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Profile Photo & Account Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-purple-500" />
            1. Faculty Identity & Photo
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="relative w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black text-xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm flex-shrink-0">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <GraduationCap className="w-8 h-8 text-purple-500" />
              )}
            </div>

            <div className="space-y-2 flex-1">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Profile Picture
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Upload a clear portrait photo in PNG, JPG, or WEBP format.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold transition-all border border-purple-200/80 dark:border-purple-800">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{previewUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>

            <div className="sm:w-48 space-y-1">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Account Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE (Can Login)</option>
                <option value="INACTIVE">INACTIVE (Disabled)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Personal & Contact Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-500" />
            2. Personal & Contact Credentials
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('firstName')}
                placeholder="e.g. Anand"
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
              />
              {errors.firstName && (
                <p className="text-[11px] text-rose-500 mt-0.5">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('lastName')}
                placeholder="e.g. Kumar"
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
              />
              {errors.lastName && (
                <p className="text-[11px] text-rose-500 mt-0.5">{errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:outline-none font-mono"
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-rose-500 mt-0.5">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Official / Login Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="e.g. anand.kumar@apex.edu"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-0.5">{errors.email.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Academic Specialization & Credentials */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            3. Academic Specialization & Experience
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Subject Specialization <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('subjectTaught')}
                placeholder="e.g. Mathematics, Physical Chemistry, Botany"
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
              />
              {errors.subjectTaught && (
                <p className="text-[11px] text-rose-500 mt-0.5">{errors.subjectTaught.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Experience (Years)
              </label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="1"
                  min="0"
                  {...register('experienceYears')}
                  placeholder="e.g. 5"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:outline-none font-mono"
                />
              </div>
              {errors.experienceYears && (
                <p className="text-[11px] text-rose-500 mt-0.5">{errors.experienceYears.message}</p>
              )}
            </div>

            <div className="space-y-1 sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Educational Qualification / Degrees <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('qualification')}
                placeholder="e.g. M.Sc. in Applied Mathematics (IIT Delhi), B.Ed."
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
              />
              {errors.qualification && (
                <p className="text-[11px] text-rose-500 mt-0.5">{errors.qualification.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Payroll & Joining Date */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            4. Compensation & Joining Terms
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Monthly Base Salary (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                {...register('salary')}
                placeholder="e.g. 50000"
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:outline-none font-mono"
              />
              {errors.salary && (
                <p className="text-[11px] text-rose-500 mt-0.5">{errors.salary.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Joining Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  {...register('joiningDate')}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:outline-none font-mono"
                />
              </div>
              {errors.joiningDate && (
                <p className="text-[11px] text-rose-500 mt-0.5">{errors.joiningDate.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate('/faculty')}
            >
              Cancel
            </Button>

            {isEditMode && (
              <Button
                type="button"
                variant="danger"
                size="md"
                leftIcon={Trash2}
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete Faculty
              </Button>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={CheckCircle2}
          >
            {isSubmitting
              ? 'Saving Faculty Record...'
              : isEditMode
              ? 'Update Faculty Member'
              : 'Register Faculty Member'}
          </Button>
        </div>
      </form>

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Faculty Member"
        message={`Are you sure you want to permanently delete ${existingFaculty?.firstName || ''} ${existingFaculty?.lastName || ''}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default FacultyCreatePage;
