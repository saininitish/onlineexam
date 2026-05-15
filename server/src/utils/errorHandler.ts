export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (err: any, res: any) => {
  const { statusCode = 500, message, status = 'error' } = err;
  
  // Always log error to server console for debugging production issues
  console.error('💥 ERROR:', {
    message: err.message,
    status: err.status,
    statusCode: err.statusCode,
    stack: err.stack,
    details: err // Capture full object for Supabase errors
  });

  res.status(statusCode).json({
    status,
    message: message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, error: err })
  });
};
