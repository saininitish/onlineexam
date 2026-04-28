export class AppError extends Error {
    statusCode;
    status;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
export const handleError = (err, res) => {
    const { statusCode = 500, message, status = 'error' } = err;
    // Production vs Dev logging
    if (process.env.NODE_ENV === 'development') {
        console.error('💥 ERROR:', err);
    }
    res.status(statusCode).json({
        status,
        message: statusCode === 500 ? 'Internal Server Error' : message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack, error: err })
    });
};
