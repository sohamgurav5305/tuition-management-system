import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Users, Filter } from 'lucide-react';
import { batchApi, courseApi } from '../../services/api';
import { Batch, Course } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const BatchList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  const canEdit = user?.role === 'ADMINISTRATOR';

  const fetchBatches = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await batchApi.getAll({ courseId: selectedCourse || undefined });
      setBatches(res.data.data);
    } catch (err) {
      console.error('Failed to load batches', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await courseApi.getAll();
        setCourses(res.data.data);
      } catch (err) {
        console.error('Failed to load courses', err);
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    fetchBatches(true);
    const interval = setInterval(() => {
      fetchBatches(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedCourse]);

  const columns: Column<Batch>[] = [
    {
      header: 'Batch',
      cell: (b) => (
        <div>
          <span
            onClick={() => navigate(`/batches/edit/${b.id}`)}
            className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer block text-xs sm:text-sm truncate"
          >
            {b.name}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{b.batchId}</span>
        </div>
      ),
    },
    {
      header: 'Course',
      cell: (b) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {b.course?.name}
        </span>
      ),
    },
    {
      header: 'Assigned Instructors',
      cell: (b) => {
        const instructors = b.subjectInstructors && b.subjectInstructors.length > 0
          ? b.subjectInstructors
          : b.faculty
          ? [{ subject: b.faculty.subjectTaught, facultyName: `${b.faculty.firstName} ${b.faculty.lastName}` }]
          : [];

        if (instructors.length === 0) {
          return <span className="text-xs text-slate-400 dark:text-slate-500">Unassigned</span>;
        }

        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {instructors.map((inst, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-semibold border border-purple-200/60 dark:border-purple-800"
                title={`${inst.subject}: ${inst.facultyName}`}
              >
                <span className="font-bold">{inst.subject}:</span> {inst.facultyName}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Class Schedule',
      cell: (b) => {
        let days: string[] = [];
        try {
          days = typeof b.daysOfWeek === 'string' ? JSON.parse(b.daysOfWeek) : b.daysOfWeek;
        } catch {
          days = [];
        }
        return (
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {b.startTime} - {b.endTime}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">{days.join(', ')}</p>
          </div>
        );
      },
    },
    {
      header: 'Enrollment',
      cell: (b) => {
        const enrolled = b._count?.students || 0;
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{enrolled} Students</span>
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <PageHeader
        title={user?.role === 'TEACHER' ? 'My Assigned Batches' : 'Batches'}
        actions={
          canEdit && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => navigate('/batches/new')}
            >
              Create New Batch
            </Button>
          )
        }
      />

      {/* Main Batch Table */}
      <DataTable
        data={batches}
        columns={columns}
        keyExtractor={(b) => b.id}
        onRowClick={(b) => navigate(`/batches/edit/${b.id}`)}
        searchPlaceholder="Search Batches"
        searchableFields={['name', 'batchId', 'course', 'faculty', 'subjectTeachers']}
        filters={
          courses.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Course:
              </span>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : undefined
        }
        emptyTitle="No batches created yet"
        emptySubtitle="Create your first batch and assign faculty."
        emptyAction={
          canEdit
            ? {
                label: '+ Create New Batch',
                onClick: () => navigate('/batches/new'),
              }
            : undefined
        }
        isLoading={loading}
      />
    </div>
  );
};
