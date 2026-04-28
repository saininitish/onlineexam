import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { AppError, handleError } from '../utils/errorHandler.js';

export const register = async (req: Request, res: Response) => {
  try {
    const user = await AuthService.register(req.body);
    res.status(201).json({ 
      status: 'success',
      message: 'User registered successfully', 
      user 
    });
  } catch (error: any) {
    handleError(error, res);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = await AuthService.login(req.body.email, req.body.password);
    res.status(200).json({
      status: 'success',
      ...data
    });
  } catch (error: any) {
    handleError(error, res);
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    // Basic implementation for now, could be moved to service
    const data = await AuthService.login(req.body.email, req.body.password); // Placeholder
    res.status(200).json({
      status: 'success',
      ...data
    });
  } catch (error: any) {
    handleError(error, res);
  }
};
