import { Request, Response } from 'express';
import { courseService } from '../services/course.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class CourseController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      const courses = await courseService.getAllCourses(status as string);
      sendSuccess(res, courses, 'Courses fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const course = await courseService.getCourseById(id);
      sendSuccess(res, course, 'Course details fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, error);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const course = await courseService.createCourse(req.body);
      sendSuccess(res, course, 'Course created successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const course = await courseService.updateCourse(id, req.body);
      sendSuccess(res, course, 'Course updated successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await courseService.deleteCourse(id);
      sendSuccess(res, result, 'Course deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }
}

export const courseController = new CourseController();
