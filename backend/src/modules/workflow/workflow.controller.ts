import { Request, Response, NextFunction } from 'express';
import { ApplicationStatus, EventType } from '@prisma/client';
import * as workflowService from './workflow.service';
import { getApplicationById } from '../applications/applications.service';

const verifyOwnership = async (applicationId: string, userId: string) => {
  const application = await getApplicationById(applicationId);
  if (!application) {
    throw new Error('Land application not found');
  }
  if (application.applicant_id !== userId) {
    throw new Error('Forbidden: You can only act on your own applications');
  }
  return application;
};

export const submitApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { remarks } = req.body;

    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Enforce ownership
    await verifyOwnership(applicationId, req.user.user_id);

    const result = await workflowService.processTransition(
      applicationId,
      req.user.user_id,
      ApplicationStatus.DRAFT,
      ApplicationStatus.SUBMITTED,
      EventType.APPLICATION_SUBMITTED,
      remarks
    );

    res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    if (error.message.startsWith('Forbidden')) return res.status(403).json({ status: 'error', message: error.message });
    if (error.message === 'Land application not found') return res.status(404).json({ status: 'error', message: error.message });
    if (error.message.startsWith('Invalid state transition')) return res.status(400).json({ status: 'error', message: error.message });
    next(error);
  }
};

export const startVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { remarks } = req.body;

    if (!req.user || !req.user.user_id) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const result = await workflowService.processTransition(
      applicationId,
      req.user.user_id,
      ApplicationStatus.SUBMITTED,
      ApplicationStatus.UNDER_REVIEW,
      EventType.REVIEW_STARTED,
      remarks
    );

    res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    if (error.message === 'Land application not found') return res.status(404).json({ status: 'error', message: error.message });
    if (error.message.startsWith('Invalid state transition')) return res.status(400).json({ status: 'error', message: error.message });
    next(error);
  }
};

export const requestCorrection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { remarks } = req.body;

    if (!req.user || !req.user.user_id) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    if (!remarks || remarks.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Remarks are mandatory for requesting corrections' });
    }

    const result = await workflowService.processTransition(
      applicationId,
      req.user.user_id,
      ApplicationStatus.UNDER_REVIEW,
      ApplicationStatus.CORRECTION_REQUIRED,
      EventType.CORRECTION_REQUESTED,
      remarks
    );

    res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    if (error.message === 'Land application not found') return res.status(404).json({ status: 'error', message: error.message });
    if (error.message.startsWith('Invalid state transition')) return res.status(400).json({ status: 'error', message: error.message });
    next(error);
  }
};

export const resubmitApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { remarks } = req.body;

    if (!req.user || !req.user.user_id) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    // Enforce ownership
    await verifyOwnership(applicationId, req.user.user_id);

    const result = await workflowService.processTransition(
      applicationId,
      req.user.user_id,
      ApplicationStatus.CORRECTION_REQUIRED,
      ApplicationStatus.SUBMITTED,
      EventType.APPLICATION_RESUBMITTED,
      remarks
    );

    res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    if (error.message.startsWith('Forbidden')) return res.status(403).json({ status: 'error', message: error.message });
    if (error.message === 'Land application not found') return res.status(404).json({ status: 'error', message: error.message });
    if (error.message.startsWith('Invalid state transition')) return res.status(400).json({ status: 'error', message: error.message });
    next(error);
  }
};

export const completeVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { remarks } = req.body;

    if (!req.user || !req.user.user_id) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const result = await workflowService.processTransition(
      applicationId,
      req.user.user_id,
      ApplicationStatus.UNDER_REVIEW,
      ApplicationStatus.VERIFIED,
      EventType.APPLICATION_VERIFIED,
      remarks
    );

    res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    if (error.message === 'Land application not found') return res.status(404).json({ status: 'error', message: error.message });
    if (error.message.startsWith('Invalid state transition')) return res.status(400).json({ status: 'error', message: error.message });
    next(error);
  }
};

export const requestApproval = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { remarks } = req.body;

    if (!req.user || !req.user.user_id) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const result = await workflowService.processTransition(
      applicationId,
      req.user.user_id,
      ApplicationStatus.VERIFIED,
      ApplicationStatus.PENDING_APPROVAL,
      EventType.APPROVAL_REQUESTED,
      remarks
    );

    res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    if (error.message === 'Land application not found') return res.status(404).json({ status: 'error', message: error.message });
    if (error.message.startsWith('Invalid state transition')) return res.status(400).json({ status: 'error', message: error.message });
    next(error);
  }
};

export const finalApprove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { remarks } = req.body;

    if (!req.user || !req.user.user_id) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const result = await workflowService.processFinalApproval(
      applicationId,
      req.user.user_id,
      remarks
    );

    res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    if (error.message === 'Land application not found') return res.status(404).json({ status: 'error', message: error.message });
    if (error.message.startsWith('Invalid state transition')) return res.status(400).json({ status: 'error', message: error.message });
    next(error);
  }
};

export const finalReject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { remarks } = req.body;

    if (!req.user || !req.user.user_id) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    if (!remarks || remarks.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Remarks are mandatory for final rejection' });
    }

    const result = await workflowService.processTransition(
      applicationId,
      req.user.user_id,
      ApplicationStatus.PENDING_APPROVAL,
      ApplicationStatus.REJECTED,
      EventType.ASSET_REJECTED,
      remarks
    );

    res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    if (error.message === 'Land application not found') return res.status(404).json({ status: 'error', message: error.message });
    if (error.message.startsWith('Invalid state transition')) return res.status(400).json({ status: 'error', message: error.message });
    next(error);
  }
};
