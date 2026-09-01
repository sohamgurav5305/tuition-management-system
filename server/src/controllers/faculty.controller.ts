import { Request, Response } from 'express';
import { facultyService } from '../services/faculty.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class FacultyController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      const faculty = await facultyService.getAllFaculty(search as string);
      sendSuccess(res, faculty, 'Faculty list fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const faculty = await facultyService.getFacultyById(id);
      sendSuccess(res, faculty, 'Faculty details fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, error);
    }
  }

  async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }
      const faculty = await facultyService.getFacultyByUserId(req.user.id);
      sendSuccess(res, faculty, 'Faculty profile fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, error);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      const faculty = await facultyService.createFaculty(req.body, file);
      sendSuccess(res, faculty, 'Faculty member added successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const file = req.file;
      const faculty = await facultyService.updateFaculty(id, req.body, file);
      sendSuccess(res, faculty, 'Faculty updated successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await facultyService.deleteFaculty(id);
      sendSuccess(res, result, 'Faculty deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }
}

export const facultyController = new FacultyController();
