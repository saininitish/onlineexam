import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret';
const generateTokens = (user) => {
    const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' } // Short lived
    );
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' } // Long lived
    );
    return { accessToken, refreshToken };
};
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
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
            throw error;
        res.status(201).json({
            message: 'User registered successfully',
            user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (!user || error) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const { accessToken, refreshToken } = generateTokens(user);
        res.status(200).json({
            token: accessToken,
            refreshToken,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.id)
            .single();
        if (!user || error) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
        res.status(200).json({
            token: accessToken,
            refreshToken: newRefreshToken
        });
    }
    catch (error) {
        res.status(401).json({ message: 'Refresh token expired or invalid' });
    }
};
