import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/errorHandler.js';
import { SaaSService } from './saasService.js';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret';
export class AuthService {
    static generateTokens(user) {
        const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' } // Increased from 1h to 7d to prevent frequent timeouts
        );
        const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '30d' });
        return { accessToken, refreshToken };
    }
    static async register(userData) {
        const { name, email, password, role, referralCode, adminSecret } = userData;
        // Security: Only allow admin registration if a secret key matches
        if (role === 'admin') {
            const systemAdminSecret = process.env.ADMIN_SECRET_KEY || 'my-super-secret-admin-key-123';
            if (adminSecret !== systemAdminSecret) {
                throw new AppError('Unauthorized: Invalid Admin Secret Key.', 401);
            }
        }
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (existingUser) {
            throw new AppError('User already exists', 400);
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([
            { name, email, password: hashedPassword, role: role || 'student' }
        ])
            .select()
            .single();
        if (error)
            throw new AppError(error.message, 500);
        // Process referral if exists
        if (referralCode) {
            await SaaSService.processReferral(newUser.id, referralCode);
        }
        return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        };
    }
    static async login(email, password) {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (!user || error) {
            throw new AppError('Invalid credentials', 400);
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AppError('Invalid credentials', 400);
        }
        const { accessToken, refreshToken } = this.generateTokens(user);
        return {
            token: accessToken,
            refreshToken,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        };
    }
}
