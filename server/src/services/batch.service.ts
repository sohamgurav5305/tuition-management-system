import { batchRepository, BatchFilterParams } from '../repositories/batch.repository';
import { courseRepository } from '../repositories/course.repository';
import { facultyRepository } from '../repositories/faculty.repository';
import { generateBatchId } from '../utils/idGenerator.util';
import prisma from '../prisma/client';

export class BatchService {
  /**
   * Enriches a batch object with resolved subject instructors details
   */
  private async enrichBatchWithSubjectInstructors(batch: any) {
    if (!batch) return null;
    const subjectInstructors: {
      subject: string;
      facultyId: string;
      facultyName: string;
      subjectTaught: string;
      phone?: string;
      email?: string;
    }[] = [];

    if (batch.subjectTeachers) {
      try {
        const parsedMap: Record<string, string> = typeof batch.subjectTeachers === 'string'
          ? JSON.parse(batch.subjectTeachers)
          : batch.subjectTeachers;

        const facultyIds = Object.values(parsedMap).filter(Boolean);
        if (facultyIds.length > 0) {
          const facultyMembers = await prisma.faculty.findMany({
            where: { id: { in: facultyIds } },
          });

          const facultyById = new Map(facultyMembers.map((f) => [f.id, f]));

          for (const [subj, facId] of Object.entries(parsedMap)) {
            const fac = facultyById.get(facId);
            if (fac) {
              subjectInstructors.push({
                subject: subj,
                facultyId: fac.id,
                facultyName: `${fac.firstName} ${fac.lastName}`,
                subjectTaught: fac.subjectTaught,
                phone: fac.phone,
                email: fac.email,
              });
            }
          }
        }
      } catch {
        // ignore parse error
      }
    }

    if (subjectInstructors.length === 0 && batch.faculty) {
      subjectInstructors.push({
        subject: batch.faculty.subjectTaught || 'Primary Subject',
        facultyId: batch.faculty.id,
        facultyName: `${batch.faculty.firstName} ${batch.faculty.lastName}`,
        subjectTaught: batch.faculty.subjectTaught,
        phone: batch.faculty.phone,
        email: batch.faculty.email,
      });
    }

    return {
      ...batch,
      subjectInstructors,
    };
  }

  async getAllBatches(filters?: BatchFilterParams) {
    const list = await batchRepository.findAll(filters);
    return Promise.all(list.map((b) => this.enrichBatchWithSubjectInstructors(b)));
  }

  async getBatchById(id: string) {
    const batch = await batchRepository.findById(id);
    if (!batch) {
      throw new Error('Batch not found');
    }
    return this.enrichBatchWithSubjectInstructors(batch);
  }

  /**
   * Helper to check time overlap between two time slots [start1, end1] and [start2, end2] (e.g. "09:00", "11:00")
   */
  private checkTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Helper to check day overlap between two arrays of days (e.g. ["Mon", "Wed"] and ["Wed", "Fri"])
   */
  private checkDayOverlap(days1: string[], days2: string[]): boolean {
    return days1.some((d) => days2.includes(d));
  }

  /**
   * Enforces classroom and faculty schedule conflict validations
   */
  async validateScheduleConflicts(params: {
    batchId?: string;
    facultyId: string;
    classroom: string;
    startTime: string;
    endTime: string;
    daysOfWeek: string[];
  }): Promise<void> {
    if (params.startTime >= params.endTime) {
      throw new Error('Batch end time must be after start time');
    }

    const activeBatches = await batchRepository.findActiveBatchesForConflictCheck(params.batchId);

    for (const other of activeBatches) {
      let otherDays: string[] = [];
      try {
        otherDays = typeof other.daysOfWeek === 'string' ? JSON.parse(other.daysOfWeek) : other.daysOfWeek;
      } catch {
        otherDays = [];
      }

      const hasDayConflict = this.checkDayOverlap(params.daysOfWeek, otherDays);
      const hasTimeConflict = this.checkTimeOverlap(params.startTime, params.endTime, other.startTime, other.endTime);

      if (hasDayConflict && hasTimeConflict) {
        // Faculty collision check
        if (other.facultyId === params.facultyId) {
          throw new Error(
            `Faculty Conflict: Instructor is already assigned to teach batch '${other.name}' during this time (${other.startTime} - ${other.endTime} on ${otherDays.join(', ')}).`
          );
        }
      }
    }
  }

  async createBatch(data: any) {
    const course = await courseRepository.findById(data.courseId);
    if (!course) throw new Error('Selected course does not exist');

    const faculty = await facultyRepository.findById(data.facultyId);
    if (!faculty) throw new Error('Selected faculty does not exist');

    const days = Array.isArray(data.daysOfWeek) ? data.daysOfWeek : JSON.parse(data.daysOfWeek || '[]');
    if (days.length === 0) {
      throw new Error('At least one day of the week must be selected for the batch schedule');
    }

    await this.validateScheduleConflicts({
      facultyId: data.facultyId,
      classroom: data.classroom,
      startTime: data.startTime,
      endTime: data.endTime,
      daysOfWeek: days,
    });

    const batchId = await generateBatchId();

    let subjectTeachersJson: string | null = null;
    if (data.subjectTeachers) {
      subjectTeachersJson = typeof data.subjectTeachers === 'string'
        ? data.subjectTeachers
        : JSON.stringify(data.subjectTeachers);
    }

    const created = await batchRepository.create({
      batchId,
      name: data.name,
      courseId: data.courseId,
      facultyId: data.facultyId,
      subjectTeachers: subjectTeachersJson,
      classroom: data.classroom,
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.startTime,
      endTime: data.endTime,
      daysOfWeek: JSON.stringify(days),
      syllabusPct: Number(data.syllabusPct || 0),
      status: data.status || 'ACTIVE',
    });

    return this.enrichBatchWithSubjectInstructors(created);
  }

  async updateBatch(id: string, data: any) {
    const existing = await batchRepository.findById(id);
    if (!existing) throw new Error('Batch not found');

    const days = data.daysOfWeek
      ? (Array.isArray(data.daysOfWeek) ? data.daysOfWeek : JSON.parse(data.daysOfWeek))
      : JSON.parse(existing.daysOfWeek);

    const facultyId = data.facultyId || existing.facultyId;
    const classroom = data.classroom || existing.classroom;
    const startTime = data.startTime || existing.startTime;
    const endTime = data.endTime || existing.endTime;

    await this.validateScheduleConflicts({
      batchId: id,
      facultyId,
      classroom,
      startTime,
      endTime,
      daysOfWeek: days,
    });

    let subjectTeachersJson = existing.subjectTeachers;
    if (data.subjectTeachers !== undefined) {
      subjectTeachersJson = typeof data.subjectTeachers === 'string'
        ? data.subjectTeachers
        : JSON.stringify(data.subjectTeachers);
    }

    const updated = await batchRepository.update(id, {
      name: data.name ?? existing.name,
      courseId: data.courseId ?? existing.courseId,
      facultyId,
      subjectTeachers: subjectTeachersJson,
      classroom,
      startDate: data.startDate ?? existing.startDate,
      endDate: data.endDate ?? existing.endDate,
      startTime,
      endTime,
      daysOfWeek: JSON.stringify(days),
      syllabusPct: data.syllabusPct !== undefined ? Number(data.syllabusPct) : existing.syllabusPct,
      status: data.status ?? existing.status,
    });

    return this.enrichBatchWithSubjectInstructors(updated);
  }

  async deleteBatch(id: string) {
    const existing = await batchRepository.findById(id);
    if (!existing) throw new Error('Batch not found');

    if (existing._count?.students > 0) {
      throw new Error(`Cannot delete batch with ${existing._count.students} enrolled students. Please reassign students first.`);
    }

    return batchRepository.delete(id);
  }

  async getTimetable() {
    const batches = await batchRepository.findAll({ status: 'ACTIVE' });
    return batches.map((b) => {
      let parsedDays: string[] = [];
      try {
        parsedDays = JSON.parse(b.daysOfWeek);
      } catch {
        parsedDays = [];
      }
      return {
        id: b.id,
        batchId: b.batchId,
        batchName: b.name,
        courseName: b.course.name,
        facultyName: `${b.faculty.firstName} ${b.faculty.lastName}`,
        subjectTaught: b.faculty.subjectTaught,
        classroom: b.classroom,
        startTime: b.startTime,
        endTime: b.endTime,
        daysOfWeek: parsedDays,
        syllabusPct: b.syllabusPct,
        studentCount: b._count.students,
      };
    });
  }
}

export const batchService = new BatchService();
