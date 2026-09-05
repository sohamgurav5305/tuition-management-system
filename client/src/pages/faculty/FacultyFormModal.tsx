import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { facultyApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Faculty } from '../../types';
import { getMediaUrl } from '../../utils/media';

const facultySchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  subjectTaught: z.string().min(1, 'Subject taught is required'),
  qualification: z.string().min(1, 'Qualification is required'),
  experienceYears: z.coerce.number().min(0, 'Experience must be non-negative'),
  salary: z.coerce.number().min(0, 'Salary must be non-negative'),
  joiningDate: z.string().optional(),
  status: z.string().default('ACTIVE'),
});

type FacultyFormValues = z.infer<typeof facultySchema>;

interface FacultyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialFaculty?: Faculty | null;
}

export const FacultyFormModal: React.FC<FacultyFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialFaculty,
}) => {
  const { success, error } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    if (initialFaculty) {
      reset({
        firstName: initialFaculty.firstName,
        lastName: initialFaculty.lastName,
        phone: initialFaculty.phone,
        email: initialFaculty.email,
        subjectTaught: initialFaculty.subjectTaught,
        qualification: initialFaculty.qualification,
        experienceYears: initialFaculty.experienceYears,
        salary: initialFaculty.salary,
        joiningDate: initialFaculty.joiningDate,
        status: initialFaculty.status,
      });
    } else {
      reset({
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
      });
    }
    setSelectedFile(null);
  }, [initialFaculty, reset, isOpen]);

  const onSubmit = async (values: FacultyFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formData.append(k, String(v));
        }
      });

      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }

      if (initialFaculty) {
        await facultyApi.update(initialFaculty.id, formData);
        success('Faculty Updated', 'Faculty member details updated successfully');
      } else {
        await facultyApi.create(formData);
        success('Faculty Added', 'New faculty member registered successfully');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      error('Validation Error', err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialFaculty ? `Edit Faculty: ${initialFaculty.facultyId}` : 'Add New Faculty'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Photo upload */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 text-slate-400">
            {selectedFile ? (
              <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
            ) : initialFaculty?.avatarUrl ? (
              <img src={getMediaUrl(initialFaculty.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Faculty Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
              }}
              className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
            <input
              type="text"
              {...register('firstName')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
            {errors.firstName && <p className="text-xs text-rose-500 mt-1">{errors.firstName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Last Name *</label>
            <input
              type="text"
              {...register('lastName')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
            {errors.lastName && <p className="text-xs text-rose-500 mt-1">{errors.lastName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Subject Specialization *</label>
            <input
              type="text"
              {...register('subjectTaught')}
              placeholder=""
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
            {errors.subjectTaught && <p className="text-xs text-rose-500 mt-1">{errors.subjectTaught.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Qualification *</label>
            <input
              type="text"
              {...register('qualification')}
              placeholder=""
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
            {errors.qualification && <p className="text-xs text-rose-500 mt-1">{errors.qualification.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Phone *</label>
            <input
              type="text"
              {...register('phone')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Experience (Years)</label>
            <input
              type="number"
              {...register('experienceYears')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Monthly Salary (₹)</label>
            <input
              type="number"
              step="any"
              {...register('salary')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : initialFaculty ? 'Save Changes' : 'Add New Faculty'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
