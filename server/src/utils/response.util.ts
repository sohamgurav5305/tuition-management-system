import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export const sendSuccess = <T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res: Response, message: string = 'Internal Server Error', statusCode: number = 500, error?: any): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error ? (error.message || error) : undefined,
  });
};
