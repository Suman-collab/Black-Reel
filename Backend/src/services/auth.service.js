import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import { z } from 'zod';
import { validate } from '../utils/validate.js';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please provide a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

export const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  avatarUrl: user.avatarUrl,
  preferences: user.preferences,
  subscription: user.subscription,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const registerUser = async (payload) => {
  const userData = validate(registerSchema, payload);
  userData.email = userData.email.toLowerCase();

  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new AppError('Email is already in use', 400);
  }

  const user = await User.create(userData);
  const token = signToken(user);

  return { user, token };
};

export const loginUser = async (payload) => {
  const { email, password } = validate(loginSchema, payload);

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Incorrect email or password', 401);
  }

  if (user.status === 'banned') {
    throw new AppError('This account has been suspended. Please contact support.', 403);
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user);
  return { user, token };
};

export const getAuthenticatedUser = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};
