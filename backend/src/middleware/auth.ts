import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

interface JwtPayload {
  user_id: string;
  role: Role;
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Unauthorized', 401));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next(new AppError('Unauthorized', 401));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new AppError('JWT_SECRET environment variable is missing', 500));
    }

    let decoded: unknown;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      // Missing, malformed, invalid, or expired tokens must return HTTP 401
      return next(new AppError('Unauthorized', 401));
    }

    if (typeof decoded !== 'object' || decoded === null) {
      return next(new AppError('Unauthorized', 401));
    }

    const payload = decoded as Partial<JwtPayload>;

    // Validate user_id
    if (typeof payload.user_id !== 'string' || payload.user_id.trim() === '') {
      return next(new AppError('Unauthorized', 401));
    }

    // Validate role against Prisma Role enum
    const validRoles = Object.values(Role);
    if (typeof payload.role !== 'string' || !validRoles.includes(payload.role as Role)) {
      return next(new AppError('Unauthorized', 401));
    }

    req.user = {
      user_id: payload.user_id,
      role: payload.role as Role,
    };

    next();
  } catch (err) {
    return next(new AppError('Unauthorized', 401));
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403));
    }

    next();
  };
};
