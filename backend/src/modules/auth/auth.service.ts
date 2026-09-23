import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { Role } from '@prisma/client';

class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateToken = (userId: string, role: Role): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT_SECRET environment variable is missing', 500);
  }
  const expiresIn = (process.env.JWT_EXPIRES_IN || '24h') as jwt.SignOptions['expiresIn'];
  
  return jwt.sign(
    { user_id: userId, role },
    secret,
    { expiresIn }
  );
};

export const registerUser = async (name?: string, email?: string, password?: string) => {
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new AppError('Name cannot be empty or just whitespace', 400);
  }
  const normalizedEmail = email.toLowerCase().trim();

  if (!isValidEmail(normalizedEmail)) {
    throw new AppError('Invalid email format', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError('Email is already registered', 409);
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const newUser = await prisma.user.create({
    data: {
      name: trimmedName,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: Role.APPLICANT, // Always APPLICANT for public registration
    },
    select: {
      user_id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
      updated_at: true,
    }
  });

  return newUser;
};

export const loginUser = async (email?: string, password?: string) => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user.user_id, user.role);

  const { password_hash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
      updated_at: true,
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};
