import prisma from '../prisma/client';
import { Prisma, StudyMaterial } from '@prisma/client';

export class MaterialRepository {
  async findById(id: string) {
    return prisma.studyMaterial.findUnique({
      where: { id },
      include: { course: true, batch: true },
    });
  }

  async findAll(filters?: { courseId?: string; batchId?: string; materialType?: string; subject?: string; search?: string }) {
    const where: Prisma.StudyMaterialWhereInput = {};

    if (filters?.courseId) where.courseId = filters.courseId;
    if (filters?.batchId) where.batchId = filters.batchId;
    if (filters?.materialType) where.materialType = filters.materialType;
    if (filters?.subject) where.subject = filters.subject;

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { chapterName: { contains: filters.search } },
        { materialId: { contains: filters.search } },
      ];
    }

    return prisma.studyMaterial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { course: true, batch: true },
    });
  }

  async create(data: Prisma.StudyMaterialUncheckedCreateInput): Promise<StudyMaterial> {
    return prisma.studyMaterial.create({ data });
  }

  async update(id: string, data: Prisma.StudyMaterialUncheckedUpdateInput): Promise<StudyMaterial> {
    return prisma.studyMaterial.update({ where: { id }, data });
  }

  async delete(id: string): Promise<StudyMaterial> {
    return prisma.studyMaterial.delete({ where: { id } });
  }

  async incrementDownload(id: string): Promise<StudyMaterial> {
    return prisma.studyMaterial.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
  }
}

export const materialRepository = new MaterialRepository();
