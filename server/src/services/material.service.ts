import { materialRepository } from '../repositories/material.repository';
import { batchRepository } from '../repositories/batch.repository';
import { notificationService } from './notification.service';
import { generateMaterialId } from '../utils/idGenerator.util';
import { storage } from '../storage';

function resolveFileUrls(fileUrlsJson?: string | null, singleUrl?: string | null): string[] {
  if (fileUrlsJson) {
    try {
      const parsed = JSON.parse(fileUrlsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: string) => storage.getUrl(p));
      }
    } catch {
      // ignore
    }
  }
  return singleUrl ? [storage.getUrl(singleUrl)] : [];
}

export class MaterialService {
  async getAllMaterials(filters?: { courseId?: string; batchId?: string; materialType?: string; subject?: string; search?: string }) {
    const list = await materialRepository.findAll(filters);
    return list.map(m => {
      const files = resolveFileUrls((m as any).fileUrls, m.fileUrl);
      return {
        ...m,
        fileUrl: m.fileUrl ? storage.getUrl(m.fileUrl) : files[0] || null,
        files,
      };
    });
  }

  async getMaterialById(id: string) {
    const material = await materialRepository.findById(id);
    if (!material) throw new Error('Study material not found');
    const files = resolveFileUrls((material as any).fileUrls, material.fileUrl);
    return {
      ...material,
      fileUrl: material.fileUrl ? storage.getUrl(material.fileUrl) : files[0] || null,
      files,
    };
  }

  async uploadMaterial(data: any, files?: any[]) {
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

    const uploadedPaths: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const p = await storage.upload(file, 'study-materials');
        uploadedPaths.push(p);
      }
    }

    const materialId = await generateMaterialId();

    const material = await materialRepository.create({
      materialId,
      title: data.title.trim(),
      materialType: data.materialType || 'DPP',
      subject: data.subject || batch.course.name,
      chapterName: data.chapterName || '',
      courseId: data.courseId || batch.courseId,
      batchId: data.batchId,
      fileUrl: uploadedPaths[0] || null,
      fileUrls: uploadedPaths.length > 0 ? JSON.stringify(uploadedPaths) : null,
    } as any);

    // Notify students of newly uploaded material
    try {
      await notificationService.createNotification({
        title: `New Study Material: ${material.title}`,
        message: `New ${material.materialType} "${material.title}" (${uploadedPaths.length > 1 ? `${uploadedPaths.length} files` : 'Document'}) for ${material.subject} (${batch.name}) is now available.`,
        type: 'SUCCESS',
        targetRole: 'STUDENT',
      });
    } catch (e) {
      console.error('Failed to send material notification', e);
    }

    return {
      ...material,
      fileUrl: uploadedPaths[0] ? storage.getUrl(uploadedPaths[0]) : null,
      files: uploadedPaths.map((p) => storage.getUrl(p)),
    };
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
