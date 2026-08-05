import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  data: T | null = null,
  message?: string
): Response => {
  const response: ApiResponse<T> = {
    success,
    data,
  };
  if (message) {
    response.message = message;
  }
  return res.status(statusCode).json(response);
};

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response => {
  return sendResponse(res, statusCode, true, data, message);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  data: any = null
): Response => {
  return sendResponse(res, statusCode, false, data, message);
};
