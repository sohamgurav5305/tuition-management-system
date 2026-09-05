import { Request, Response } from 'express';
import { materialService } from '../services/material.service';
import prisma from '../prisma/client';
import { resolveFacultyId, resolveStudentId, getFacultyAssignedBatchIds } from '../utils/userResolver';

export class MaterialController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, batchId, materialType, subject, search } = req.query;

      let effectiveBatchId = batchId as string | undefined;

      // Access Control: If a Student is requesting, strictly limit materials to their enrolled batch
      if (req.user?.role === 'STUDENT') {
        const studentId = await resolveStudentId(req.user);
        if (!studentId) {
          res.json({ success: true, data: [] });
          return;
        }

        const student = await prisma.student.findUnique({
          where: { id: studentId },
          select: { batchId: true, courseId: true },
        });

        if (!student || !student.batchId) {
          res.json({ success: true, data: [] });
          return;
        }

        // Enforce student's own batch only
        effectiveBatchId = student.batchId;
      }

      // Access Control: If a Teacher is requesting, strictly limit to their assigned batches
      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        if (!facultyId) {
          res.json({ success: true, data: [] });
          return;
        }

        const assignedBatchIds = await getFacultyAssignedBatchIds(facultyId);
        if (assignedBatchIds.length === 0) {
          res.json({ success: true, data: [] });
          return;
        }

        if (effectiveBatchId && !assignedBatchIds.includes(effectiveBatchId)) {
          res.json({ success: true, data: [] });
          return;
        }

        const allMaterials = await materialService.getAllMaterials({
          courseId: courseId as string,
          batchId: effectiveBatchId,
          materialType: materialType as string,
          subject: subject as string,
          search: search as string,
        });

        const teacherMaterials = allMaterials.filter(
          (m) => m.batchId && assignedBatchIds.includes(m.batchId)
        );

        res.json({ success: true, data: teacherMaterials });
        return;
      }

      const materials = await materialService.getAllMaterials({
        courseId: courseId as string,
        batchId: effectiveBatchId,
        materialType: materialType as string,
        subject: subject as string,
        search: search as string,
      });
      res.json({ success: true, data: materials });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const material = await materialService.getMaterialById(req.params.id);

      if (req.user?.role === 'STUDENT') {
        const studentId = await resolveStudentId(req.user);
        const student = studentId
          ? await prisma.student.findUnique({ where: { id: studentId } })
          : null;

        if (!student || (material.batchId && student.batchId !== material.batchId)) {
          res.status(403).json({
            success: false,
            message: 'Access denied: This study material is restricted to another batch',
          });
          return;
        }
      }

      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        if (material.batchId && !assignedBatchIds.includes(material.batchId)) {
          res.status(403).json({
            success: false,
            message: 'Access denied: This study material belongs to another batch',
          });
          return;
        }
      }

      res.json({ success: true, data: material });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body.batchId) {
        res.status(400).json({
          success: false,
          message: 'Target Class Batch is required when uploading study material',
        });
        return;
      }

      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        if (!assignedBatchIds.includes(req.body.batchId)) {
          res.status(403).json({
            success: false,
            message: 'Access denied: You can only upload study materials to your assigned batches',
          });
          return;
        }
      }

      const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
      const material = await materialService.uploadMaterial(req.body, files);
      res.status(201).json({
        success: true,
        data: material,
        message: 'Study material uploaded successfully for the selected batch',
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const material = await materialService.getMaterialById(req.params.id);

      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        if (material.batchId && !assignedBatchIds.includes(material.batchId)) {
          res.status(403).json({
            success: false,
            message: 'Access denied: You can only delete materials from your assigned batches',
          });
          return;
        }
      }

      await materialService.deleteMaterial(req.params.id);
      res.json({ success: true, message: 'Study material deleted' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async trackDownload(req: Request, res: Response): Promise<void> {
    try {
      const material = await materialService.getMaterialById(req.params.id);

      if (req.user?.role === 'STUDENT') {
        const studentId = await resolveStudentId(req.user);
        const student = studentId
          ? await prisma.student.findUnique({ where: { id: studentId } })
          : null;

        if (!student || (material.batchId && student.batchId !== material.batchId)) {
          res.status(403).json({
            success: false,
            message: 'Access denied: You cannot download material assigned to another batch',
          });
          return;
        }
      }

      const updated = await materialService.trackDownload(req.params.id);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const materialController = new MaterialController();
