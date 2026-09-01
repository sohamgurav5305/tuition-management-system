import { materialRepository } from '../repositories/material.repository';
import { batchRepository } from '../repositories/batch.repository';
import { storage } from '../storage';

export class MaterialService {
  async getAllMaterials(filters?: { courseId?: string; batchId?: string; materialType?: string; subject?: string; search?: string }) {
    const list = await materialRepository.findAll(filters);
    return list.map(m => ({
      ...m,
      fileUrl: m.fileUrl ? storage.getUrl(m.fileUrl) : null,
    }));
  }

  async getMaterialById(id: string) {
    const material = await materialRepository.findById(id);
    if (!material) throw new Error('Study material not found');
    return {
      ...material,
      fileUrl: material.fileUrl ? storage.getUrl(material.fileUrl) : null,
    };
  }

  async uploadMaterial(data: any, file?: any) {
    if (!data.title || !data.title.trim()) {
      throw new Error('Material title is required');
    }
    if (!data.batchId) {
      throw new Error('Class batch selection is mandatory for study material upload');
    }

    const batch = await batchRepository.findById(data.batchId);
    if (!batch) {
      throw new Error('Selected batch not found');
    }

    let fileUrl: string | undefined = undefined;
    if (file) {
      fileUrl = await storage.upload(file, 'study-materials');
    }

    const count = (await materialRepository.findAll()).length;
    const materialId = `MAT-2026-${String(count + 1).padStart(4, '0')}`;

    return materialRepository.create({
      materialId,
      title: data.title.trim(),
      materialType: data.materialType || 'DPP',
      subject: data.subject || batch.course.name,
      chapterName: data.chapterName || '',
      courseId: data.courseId || batch.courseId,
      batchId: data.batchId,
      fileUrl,
    });
  }

  async deleteMaterial(id: string) {
    const existing = await materialRepository.findById(id);
    if (existing?.fileUrl) {
      await storage.delete(existing.fileUrl);
    }
    return materialRepository.delete(id);
  }

  async trackDownload(id: string) {
    return materialRepository.incrementDownload(id);
  }
}

export const materialService = new MaterialService();
