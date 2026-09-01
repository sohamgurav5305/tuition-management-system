import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, X } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { studentApi, courseApi, batchApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Course, Batch, Student } from '../../types';

const studentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(1, 'Address is required'),
  guardianName: z.string().min(1, 'Guardian name is required'),
  guardianRelation: z.string().min(1, 'Relationship is required'),
  guardianPhone: z.string().min(1, 'Guardian phone is required'),
  emergencyContact: z.string().min(1, 'Emergency contact is required'),
  courseId: z.string().optional(),
  batchId: z.string().optional(),
  admissionDate: z.string().optional(),
  status: z.string().default('ACTIVE'),
  totalFee: z.coerce.number().min(0, 'Fee must be non-negative').optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialStudent?: Student | null;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStudent,
}) => {
  const { success, error } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '2008-01-01',
      gender: 'Male',
      phone: '',
      email: '',
      address: '',
      guardianName: '',
      guardianRelation: 'Father',
      guardianPhone: '',
      emergencyContact: '',
      courseId: '',
      batchId: '',
      admissionDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      totalFee: 0,
    },
  });

  const selectedCourseId = watch('courseId');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [crsRes, batRes] = await Promise.all([
          courseApi.getAll('ACTIVE'),
          batchApi.getAll({ status: 'ACTIVE' }),
        ]);
        setCourses(crsRes.data.data);
        setBatches(batRes.data.data);
      } catch (err) {
        console.error('Failed to load courses/batches', err);
      }
    };
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialStudent) {
      reset({
        firstName: initialStudent.firstName,
        lastName: initialStudent.lastName,
        dateOfBirth: initialStudent.dateOfBirth,
        gender: initialStudent.gender,
        phone: initialStudent.phone,
        email: initialStudent.email,
        address: initialStudent.address,
        guardianName: initialStudent.guardianName,
        guardianRelation: initialStudent.guardianRelation,
        guardianPhone: initialStudent.guardianPhone,
        emergencyContact: initialStudent.emergencyContact,
        courseId: initialStudent.courseId,
        batchId: initialStudent.batchId || '',
        admissionDate: initialStudent.admissionDate,
        status: initialStudent.status,
        totalFee: initialStudent.totalFee,
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        dateOfBirth: '2008-01-01',
        gender: 'Male',
        phone: '',
        email: '',
        address: '',
        guardianName: '',
        guardianRelation: 'Father',
        guardianPhone: '',
        emergencyContact: '',
        courseId: '',
        batchId: '',
        admissionDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        totalFee: 0,
      });
    }
    setSelectedFile(null);
  }, [initialStudent, reset, isOpen]);

  // Auto set standard course fee when course changes (for new students)
  useEffect(() => {
    if (!initialStudent && selectedCourseId) {
      const selected = courses.find((c) => c.id === selectedCourseId);
      if (selected) {
        setValue('totalFee', selected.fee);
      }
    }
  }, [selectedCourseId, courses, initialStudent, setValue]);

  const filteredBatches = selectedCourseId
    ? batches.filter((b) => b.courseId === selectedCourseId)
    : batches;

  const onSubmit = async (values: StudentFormValues) => {
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

      if (initialStudent) {
        await studentApi.update(initialStudent.id, formData);
        success('Student Updated', 'Student profile record updated successfully');
      } else {
        await studentApi.create(formData);
        success('Student Enrolled', 'New student registered and Student ID generated');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      error('Validation Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialStudent ? `Edit Student: ${initialStudent.studentId}` : 'Enroll New Student'}
      subtitle="Complete student academic, personal, and guardian particulars"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Image Picker */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 text-slate-400">
            {selectedFile ? (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : initialStudent?.avatarUrl ? (
              <img
                src={initialStudent.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
              Profile Photo (Stored via AWS-Ready Storage Service)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300"
            />
          </div>
        </div>

        {/* Personal Details */}
        <div>
          <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
            1. Personal Identity
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                {...register('firstName')}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
              {errors.firstName && (
                <p className="text-xs text-rose-500 mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                {...register('lastName')}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
              {errors.lastName && (
                <p className="text-xs text-rose-500 mt-1">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                {...register('dateOfBirth')}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-rose-500 mt-1">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Gender *
              </label>
              <select
                {...register('gender')}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                {...register('phone')}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
              {errors.phone && (
                <p className="text-xs text-rose-500 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="student@example.com"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Residential Address *
              </label>
              <input
                type="text"
                {...register('address')}
                placeholder="Street address, City, Zip"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
              {errors.address && (
                <p className="text-xs text-rose-500 mt-1">{errors.address.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Guardian Particulars */}
        <div>
          <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
            2. Guardian & Emergency Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Parent / Guardian Name *
              </label>
              <input
                type="text"
                {...register('guardianName')}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
              {errors.guardianName && (
                <p className="text-xs text-rose-500 mt-1">{errors.guardianName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Relationship *
              </label>
              <input
                type="text"
                {...register('guardianRelation')}
                placeholder="Father / Mother / Legal Guardian"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Parent Phone *
              </label>
              <input
                type="text"
                {...register('guardianPhone')}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Emergency Contact Number *
              </label>
              <input
                type="text"
                {...register('emergencyContact')}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Academic & Fee Information */}
        <div>
          <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
            3. Academic Enrollment & Fees
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Course *
              </label>
              <select
                {...register('courseId')}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              >
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (${c.fee})
                  </option>
                ))}
              </select>
              {errors.courseId && (
                <p className="text-xs text-rose-500 mt-1">{errors.courseId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Assigned Batch (Optional)
              </label>
              <select
                {...register('batchId')}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              >
                <option value="">Unassigned</option>
                {filteredBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.classroom})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Agreed Total Fee ($)
              </label>
              <input
                type="number"
                step="any"
                {...register('totalFee')}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {isSubmitting
              ? 'Saving...'
              : initialStudent
              ? 'Save Changes'
              : 'Enroll Student'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
