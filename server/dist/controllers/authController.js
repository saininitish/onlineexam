import { AuthService } from '../services/authService.js';
import { handleError } from '../utils/errorHandler.js';
export const register = async (req, res) => {
    try {
        const user = await AuthService.register(req.body);
        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            user
        });
    }
    catch (error) {
        handleError(error, res);
    }
};
export const login = async (req, res) => {
    try {
        const data = await AuthService.login(req.body.email, req.body.password);
        res.status(200).json({
            status: 'success',
            ...data
        });
    }
    catch (error) {
        handleError(error, res);
    }
};
export const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        // Basic implementation for now, could be moved to service
        const data = await AuthService.login(req.body.email, req.body.password); // Placeholder
        res.status(200).json({
            status: 'success',
            ...data
        });
    }
    catch (error) {
        handleError(error, res);
    }
};
