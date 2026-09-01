import prisma from '../prisma/client';
import { Setting } from '@prisma/client';

export class SettingRepository {
  async getAll(): Promise<Record<string, string>> {
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return map;
  }

  async getByKey(key: string): Promise<Setting | null> {
    return prisma.setting.findUnique({
      where: { key },
    });
  }

  async upsert(key: string, value: string, description?: string): Promise<Setting> {
    return prisma.setting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }

  async updateMany(settings: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
  }

  async exportFullBackup() {
    const [
      users,
      courses,
      faculty,
      batches,
      students,
      attendance,
      exams,
      results,
      assignments,
      payments,
      notifications,
      settings,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.course.findMany(),
      prisma.faculty.findMany(),
      prisma.batch.findMany(),
      prisma.student.findMany(),
      prisma.attendance.findMany(),
      prisma.examination.findMany(),
      prisma.result.findMany(),
      prisma.assignment.findMany(),
      prisma.payment.findMany(),
      prisma.notification.findMany(),
      prisma.setting.findMany(),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      data: {
        users,
        courses,
        faculty,
        batches,
        students,
        attendance,
        exams,
        results,
        assignments,
        payments,
        notifications,
        settings,
      },
    };
  }
}

export const settingRepository = new SettingRepository();
