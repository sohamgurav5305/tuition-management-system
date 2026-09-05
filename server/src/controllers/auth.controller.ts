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

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword) {
        sendError(res, 'Current password and new password are required', 400);
        return;
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        sendError(res, 'New password and confirmation do not match', 400);
        return;
      }

      await authService.changePassword(req.user.id, currentPassword, newPassword);
      sendSuccess(res, null, 'Password changed successfully');
    } catch (error: any) {
      sendError(res, error.message || 'Failed to change password', 400);
    }
  }
}

export const authController = new AuthController();
