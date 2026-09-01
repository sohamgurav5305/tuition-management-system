import { facultyRepository } from '../repositories/faculty.repository';
import { generateFacultyId } from '../utils/idGenerator.util';
import { storage } from '../storage';
import prisma from '../prisma/client';
import bcrypt from 'bcryptjs';

export class FacultyService {
  async getAllFaculty(search?: string) {
    const list = await facultyRepository.findAll(search);
    return list.map((f) => ({
      ...f,
      avatarUrl: f.avatarUrl ? storage.getUrl(f.avatarUrl) : null,
      batchCount: f._count.batches,
    }));
  }

  async getFacultyById(id: string) {
    const faculty = await facultyRepository.findById(id);
    if (!faculty) {
      throw new Error('Faculty record not found');
    }

    const totalStudents = faculty.batches.reduce((sum, b) => sum + (b._count?.students || 0), 0);

    return {
      ...faculty,
      avatarUrl: faculty.avatarUrl ? storage.getUrl(faculty.avatarUrl) : null,
      stats: {
        totalBatches: faculty.batches.length,
        totalStudents,
      },
    };
  }

  async getFacultyByUserId(userId: string) {
    const faculty = await facultyRepository.findByUserId(userId);
    if (!faculty) {
      throw new Error('Faculty profile not found for this user');
    }

    return {
      ...faculty,
      avatarUrl: faculty.avatarUrl ? storage.getUrl(faculty.avatarUrl) : null,
    };
  }

  async createFaculty(data: any, file?: any) {
    const facultyId = await generateFacultyId();
    let avatarUrl: string | undefined = undefined;

    if (file) {
      avatarUrl = await storage.upload(file, 'profile-images');
    }

    // Auto-create login user account if doesn't exist
    let userId = data.userId;
    if (!userId && data.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('Faculty@123', salt);
        const cleanFirst = (data.firstName || 'faculty').toLowerCase().replace(/[^a-z]/g, '');
        const cleanLast = (data.lastName || 'mentor').toLowerCase().replace(/[^a-z]/g, '');
        const username = `fac.${cleanFirst}.${cleanLast}${Math.floor(100 + Math.random() * 900)}`;

        const newUser = await prisma.user.create({
          data: {
            username,
            email: data.email,
            passwordHash,
            role: 'TEACHER',
            status: 'ACTIVE',
          },
        });
        userId = newUser.id;
      }
    }

    return facultyRepository.create({
      facultyId,
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      subjectTaught: data.subjectTaught,
      qualification: data.qualification,
      experienceYears: Number(data.experienceYears || 0),
      joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
      salary: Number(data.salary || 0),
      status: data.status || 'ACTIVE',
      avatarUrl,
    });
  }

  async updateFaculty(id: string, data: any, file?: any) {
    const existing = await facultyRepository.findById(id);
    if (!existing) {
      throw new Error('Faculty not found');
    }

    let avatarUrl = existing.avatarUrl;
    if (file) {
      if (existing.avatarUrl) {
        await storage.delete(existing.avatarUrl);
      }
      avatarUrl = await storage.upload(file, 'profile-images');
    }

    return facultyRepository.update(id, {
      firstName: data.firstName ?? existing.firstName,
      lastName: data.lastName ?? existing.lastName,
      phone: data.phone ?? existing.phone,
      email: data.email ?? existing.email,
      subjectTaught: data.subjectTaught ?? existing.subjectTaught,
      qualification: data.qualification ?? existing.qualification,
      experienceYears: data.experienceYears !== undefined ? Number(data.experienceYears) : existing.experienceYears,
      joiningDate: data.joiningDate ?? existing.joiningDate,
      salary: data.salary !== undefined ? Number(data.salary) : existing.salary,
      status: data.status ?? existing.status,
      avatarUrl,
    });
  }

  async deleteFaculty(id: string) {
    const existing = await facultyRepository.findById(id);
    if (!existing) {
      throw new Error('Faculty not found');
    }

    if (existing.batches && existing.batches.length > 0) {
      throw new Error(`Cannot delete faculty assigned to ${existing.batches.length} active batch(es). Please reassign batches first.`);
    }

    if (existing.avatarUrl) {
      await storage.delete(existing.avatarUrl);
    }

    return facultyRepository.delete(id);
  }
}

export const facultyService = new FacultyService();
