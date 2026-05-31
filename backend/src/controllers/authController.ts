import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken } from '../utils/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    // All self-registered users are BORROWERS
    const user = await User.create({ name, email, password, role: 'BORROWER' });

    const token = generateToken({ userId: user._id.toString(), role: user.role, email: user.email });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });
    console.log('Request body:', req.body);

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }
    console.log('User found:', { id: user._id, email: user.email });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }
    console.log('Password match successful for user:', { id: user._id });

    const token = generateToken({ userId: user._id.toString(), role: user.role, email: user.email });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
