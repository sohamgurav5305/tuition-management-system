import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Users, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { classroomApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Classroom } from '../../types';

const classroomSchema = z.object({
  name: z.string().min(1, 'Classroom name / number is required'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1 student'),
  roomType: z.enum(['LECTURE_HALL', 'SMART_CLASS', 'SCIENCE_LAB', 'COMPUTER_LAB', 'AUDITORIUM']),
  building: z.string().min(1, 'Building / wing location is required'),
  facilities: z.string().optional(),
  status: z.enum(['AVAILABLE', 'MAINTENANCE', 'OCCUPIED']).default('AVAILABLE'),
});

type ClassroomFormValues = z.infer<typeof classroomSchema>;

const FACILITY_SUGGESTIONS = [
  'Dual 4K Projector',
  'Central AC',
  'Smart Interactive Touch Display',
  'Surround Audio & Mic Rig',
  'Tiered Amphitheater Seating',
  'Optical Benches & Sensors',
  'Fume Hoods & Safety Station',
  'Core i7 Workstations & LAN',
  'UPS Inverter Backup',
];

interface ClassroomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialClassroom?: Classroom | null;
}

export const ClassroomFormModal: React.FC<ClassroomFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialClassroom,
}) => {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClassroomFormValues>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      name: '',
      capacity: 60,
      roomType: 'LECTURE_HALL',
      building: 'Main Academic Wing - Floor 1',
      facilities: '',
      status: 'AVAILABLE',
    },
  });

  useEffect(() => {
    if (initialClassroom) {
      reset({
        name: initialClassroom.name,
        capacity: initialClassroom.capacity,
        roomType: initialClassroom.roomType,
        building: initialClassroom.building || 'Main Academic Wing',
        facilities: initialClassroom.facilities || '',
        status: initialClassroom.status,
      });

      if (initialClassroom.facilities) {
        setSelectedFacilities(
          initialClassroom.facilities.split(',').map((f) => f.trim()).filter(Boolean)
        );
      } else {
        setSelectedFacilities([]);
      }
    } else {
      reset({
        name: '',
        capacity: 60,
        roomType: 'LECTURE_HALL',
        building: 'Main Academic Wing - Floor 1',
        facilities: '',
        status: 'AVAILABLE',
      });
      setSelectedFacilities(['Dual 4K Projector', 'Central AC', 'Smart Interactive Touch Display']);
    }
  }, [initialClassroom, reset, isOpen]);

  const toggleFacility = (facility: string) => {
    setSelectedFacilities((prev) => {
      const next = prev.includes(facility)
        ? prev.filter((f) => f !== facility)
        : [...prev, facility];
      setValue('facilities', next.join(', '));
      return next;
    });
  };

  const onSubmit = async (values: ClassroomFormValues) => {
    setIsSubmitting(true);
    const payload = {
      ...values,
      facilities: selectedFacilities.join(', '),
    };

    try {
      if (initialClassroom) {
        await classroomApi.update(initialClassroom.id, payload);
        success('Classroom Updated', `Classroom '${payload.name}' configuration updated successfully`);
      } else {
        await classroomApi.create(payload);
        success('Classroom Registered', `New venue '${payload.name}' is now available for batch allocation`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Error', err.response?.data?.message || 'Failed to save classroom venue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialClassroom ? `Edit Classroom: ${initialClassroom.name}` : 'Add Physical Classroom / Lecture Venue'}
      subtitle="Register classroom name, student seating capacity, venue type, and multimedia facilities for batch allocation"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Room Name & Capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Classroom / Venue Name *
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Lecture Hall 103 / Smart Lab A"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 font-bold"
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Seating Capacity *
            </label>
            <input
              type="number"
              {...register('capacity')}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
            />
            {errors.capacity && <p className="text-xs text-rose-500 mt-1">{errors.capacity.message}</p>}
          </div>
        </div>

        {/* Room Type & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Venue Classification *
            </label>
            <select
              {...register('roomType')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold"
            >
              <option value="LECTURE_HALL">Tiered Lecture Hall</option>
              <option value="SMART_CLASS">Interactive Smart Classroom</option>
              <option value="SCIENCE_LAB">Physics / Chemistry Science Lab</option>
              <option value="COMPUTER_LAB">Computer IT & Online Testing Lab</option>
              <option value="AUDITORIUM">Main Auditorium / Seminar Hall</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Operational Status *
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold"
            >
              <option value="AVAILABLE">Available for Batches</option>
              <option value="MAINTENANCE">Under Maintenance</option>
              <option value="OCCUPIED">Fully Occupied</option>
            </select>
          </div>
        </div>

        {/* Building Location */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Campus Wing & Floor Location *
          </label>
          <input
            type="text"
            {...register('building')}
            placeholder="e.g. Academic Block A - 2nd Floor, Room 204"
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
          />
          {errors.building && <p className="text-xs text-rose-500 mt-1">{errors.building.message}</p>}
        </div>

        {/* Facilities & Amenities */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Room Facilities & Teaching Equipment
          </label>
          <div className="flex flex-wrap gap-1.5">
            {FACILITY_SUGGESTIONS.map((fac) => {
              const isSelected = selectedFacilities.includes(fac);
              return (
                <button
                  key={fac}
                  type="button"
                  onClick={() => toggleFacility(fac)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{fac}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : initialClassroom ? 'Save Changes' : 'Register Classroom'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
