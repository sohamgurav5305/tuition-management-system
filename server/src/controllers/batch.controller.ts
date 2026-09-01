import { Request, Response } from 'express';
import { batchService } from '../services/batch.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { resolveFacultyId, getFacultyAssignedBatchIds } from '../utils/userResolver';

export class BatchController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, facultyId, status, search } = req.query;

      // Teacher Scoping: Faculty can ONLY see their assigned batches
      if (req.user?.role === 'TEACHER') {
        const myFacultyId = await resolveFacultyId(req.user);
        if (!myFacultyId) {
          sendSuccess(res, [], 'No assigned batches found');
          return;
        }

        const assignedBatchIds = await getFacultyAssignedBatchIds(myFacultyId);
        const batches = await batchService.getAllBatches({
          courseId: courseId as string,
          status: status as string,
          search: search as string,
        });

        const filtered = batches.filter((b) => assignedBatchIds.includes(b.id));
        sendSuccess(res, filtered, 'Assigned batches fetched successfully');
        return;
      }

      const batches = await batchService.getAllBatches({
        courseId: courseId as string,
        facultyId: facultyId as string,
        status: status as string,
        search: search as string,
      });
      sendSuccess(res, batches, 'Batches fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const batch = await batchService.getBatchById(id);

      // Teacher Scoping
      if (req.user?.role === 'TEACHER') {
        const myFacultyId = await resolveFacultyId(req.user);
        if (!myFacultyId) {
          sendError(res, 'Access denied: Faculty profile not found', 403);
          return;
        }
        const assignedBatchIds = await getFacultyAssignedBatchIds(myFacultyId);
        if (!assignedBatchIds.includes(id)) {
          sendError(res, 'Access denied: You are not assigned to this batch', 403);
          return;
        }
      }

      sendSuccess(res, batch, 'Batch details fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, error);
    }
  }

  async getTimetable(req: Request, res: Response): Promise<void> {
    try {
      const timetable = await batchService.getTimetable();
      sendSuccess(res, timetable, 'Timetable schedule fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const batch = await batchService.createBatch(req.body);
      sendSuccess(res, batch, 'Batch created successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const batch = await batchService.updateBatch(id, req.body);
      sendSuccess(res, batch, 'Batch updated successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await batchService.deleteBatch(id);
      sendSuccess(res, result, 'Batch deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }
}

export const batchController = new BatchController();
