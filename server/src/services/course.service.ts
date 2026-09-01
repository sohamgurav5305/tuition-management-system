import { courseRepository } from '../repositories/course.repository';
import { generateCourseId } from '../utils/idGenerator.util';

export class CourseService {
  async getAllCourses(status?: string) {
    return courseRepository.findAll(status);
  }

  async getCourseById(id: string) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new Error('Course not found');
    }
    return course;
  }

  async createCourse(data: any) {
    if (data.fee < 0) {
      throw new Error('Course fee cannot be negative');
    }

    const courseId = await generateCourseId();

    let subjectsJson: string | null = null;
    if (data.subjects) {
      subjectsJson = Array.isArray(data.subjects)
        ? JSON.stringify(data.subjects)
        : typeof data.subjects === 'string'
        ? data.subjects
        : null;
    }

    return courseRepository.create({
      courseId,
      name: data.name,
      targetExam: data.targetExam || 'JEE',
      gradeLevel: data.gradeLevel || '11th',
      description: data.description || '',
      duration: data.duration,
      fee: Number(data.fee),
      subjects: subjectsJson,
      status: data.status || 'ACTIVE',
    });
  }

  async updateCourse(id: string, data: any) {
    const existing = await courseRepository.findById(id);
    if (!existing) {
      throw new Error('Course not found');
    }

    if (data.fee !== undefined && Number(data.fee) < 0) {
      throw new Error('Course fee cannot be negative');
    }

    let subjectsJson = existing.subjects;
    if (data.subjects !== undefined) {
      subjectsJson = Array.isArray(data.subjects)
        ? JSON.stringify(data.subjects)
        : typeof data.subjects === 'string'
        ? data.subjects
        : null;
    }

    return courseRepository.update(id, {
      name: data.name ?? existing.name,
      targetExam: data.targetExam ?? existing.targetExam,
      gradeLevel: data.gradeLevel ?? existing.gradeLevel,
      description: data.description ?? existing.description,
      duration: data.duration ?? existing.duration,
      fee: data.fee !== undefined ? Number(data.fee) : existing.fee,
      subjects: subjectsJson,
      status: data.status ?? existing.status,
    });
  }

  async deleteCourse(id: string) {
    const existing = await courseRepository.findById(id);
    if (!existing) {
      throw new Error('Course not found');
    }

    if (existing._count?.batches > 0 || existing._count?.students > 0) {
      throw new Error('Cannot delete course with active batches or enrolled students');
    }

    return courseRepository.delete(id);
  }
}

export const courseService = new CourseService();
