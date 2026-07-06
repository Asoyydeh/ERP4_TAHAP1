import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * Middleware penanganan error global Express
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[Error Handler] ${err.name}: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Fallback ke 500 Internal Server Error untuk error yang tidak terdokumentasi
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal server',
  });
}
