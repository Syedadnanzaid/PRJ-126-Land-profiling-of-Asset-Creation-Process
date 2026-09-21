import { Request, Response, NextFunction } from 'express';
import { getDashboardAnalytics } from './analytics.service';

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const analytics = await getDashboardAnalytics();
    
    res.status(200).json({
      status: 'success',
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};
