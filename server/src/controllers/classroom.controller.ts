import { Request, Response } from 'express';
import { classroomService } from '../services/classroom.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class ClassroomController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      const classrooms = await classroomService.getAllClassrooms(status as string);
      sendSuccess(res, classrooms, 'Classrooms retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const classroom = await classroomService.getClassroomById(id);
      sendSuccess(res, classroom, 'Classroom details retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, error);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const classroom = await classroomService.createClassroom(req.body);
      sendSuccess(res, classroom, 'Classroom venue registered successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const classroom = await classroomService.updateClassroom(id, req.body);
      sendSuccess(res, classroom, 'Classroom venue updated successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await classroomService.deleteClassroom(id);
      sendSuccess(res, null, 'Classroom venue removed successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }
}

export const classroomController = new ClassroomController();
