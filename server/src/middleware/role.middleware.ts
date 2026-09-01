import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthenticated user', 401);
      return;
    }

    const userRole = req.user.role?.toUpperCase();
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

    if (!normalizedAllowed.includes(userRole)) {
      sendError(res, 'Access Denied: You do not have permission to perform this action', 403);
      return;
    }

    next();
  };
};
