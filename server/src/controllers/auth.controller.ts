import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, email, username, password } = req.body;
      const id = identifier || email || username;

      if (!id || !password) {
        sendError(res, 'Email/Username and password are required', 400);
        return;
      }

      const result = await authService.login(id, password);
      sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
      sendError(res, error.message || 'Login failed', 401, error);
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }
      const profile = await authService.getProfile(req.user.id);
      sendSuccess(res, profile, 'Profile fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }
}

export const authController = new AuthController();
