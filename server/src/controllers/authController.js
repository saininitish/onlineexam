import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        // Check if user exists
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
        res.status(201).json({ message: 'User registered successfully', user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
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
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
//# sourceMappingURL=authController.js.map