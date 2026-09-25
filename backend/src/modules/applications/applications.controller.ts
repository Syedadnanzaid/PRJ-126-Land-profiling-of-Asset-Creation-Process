import { Request, Response, NextFunction } from 'express';
import * as applicationsService from './applications.service';
import { ApplicationStatus } from '@prisma/client';

export const createApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { area, latitude, longitude } = req.body;

    // Manual Validation
    if (area !== undefined && (typeof area !== 'number' || area <= 0)) {
      return res.status(400).json({ status: 'error', message: 'Area must be a positive number' });
    }
    if (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
      return res.status(400).json({ status: 'error', message: 'Latitude must be between -90 and 90' });
    }
    if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
      return res.status(400).json({ status: 'error', message: 'Longitude must be between -180 and 180' });
    }

    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const newApplication = await applicationsService.createApplication(req.user.user_id, req.body);
    res.status(201).json({ status: 'success', data: newApplication });
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.user_id || !req.user.role) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    let applications;

    if (req.user.role === 'APPLICANT') {
      // APPLICANT: return ONLY applications belonging to authenticated user_id
      applications = await applicationsService.getApplicationsByApplicant(req.user.user_id);
    } else if (req.user.role === 'VERIFICATION_OFFICER') {
      // VERIFICATION_OFFICER: return verification queue
      applications = await applicationsService.getVerificationQueueApplications();
    } else if (req.user.role === 'APPROVING_AUTHORITY') {
      // APPROVING_AUTHORITY: return approval queue
      applications = await applicationsService.getApprovalQueueApplications();
    } else if (req.user.role === 'ADMIN') {
      // ADMIN: return all
      applications = await applicationsService.getAllApplications();
    } else {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    res.status(200).json({ status: 'success', data: applications });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const application = await applicationsService.getApplicationById(applicationId);
    
    if (!application) {
      return res.status(404).json({ status: 'error', message: 'Land application not found' });
    }

    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Authorization visibility
    if (req.user.role === 'APPLICANT' && application.applicant_id !== req.user.user_id) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: You can only view your own applications' });
    }
    // VERIFICATION_OFFICER, APPROVING_AUTHORITY, ADMIN are inherently authorized to view it in Phase 1

    res.status(200).json({ status: 'success', data: application });
  } catch (error) {
    next(error);
  }
};

export const updateApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Validate existence and ownership
    const existing = await applicationsService.getApplicationById(applicationId);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Land application not found' });
    }

    if (existing.applicant_id !== req.user.user_id) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: You can only update your own applications' });
    }

    if (existing.status !== ApplicationStatus.DRAFT) {
      return res.status(400).json({ status: 'error', message: 'Bad Request: Only DRAFT applications can be updated' });
    }

    const { area, latitude, longitude } = req.body;

    // Manual Validation
    if (area !== undefined && (typeof area !== 'number' || area <= 0)) {
      return res.status(400).json({ status: 'error', message: 'Area must be a positive number' });
    }
    if (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
      return res.status(400).json({ status: 'error', message: 'Latitude must be between -90 and 90' });
    }
    if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
      return res.status(400).json({ status: 'error', message: 'Longitude must be between -180 and 180' });
    }

    const updatedApplication = await applicationsService.updateApplication(applicationId, req.body);
    res.status(200).json({ status: 'success', data: updatedApplication });
  } catch (error) {
    next(error);
  }
};
