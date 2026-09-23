import { Request, Response, NextFunction } from 'express';
import { AssetStatus } from '@prisma/client';
import * as workflowService from './workflow.service';

const handleTransition = async (
  req: Request,
  res: Response,
  next: NextFunction,
  expectedStatus: AssetStatus,
  newStatus: AssetStatus
) => {
  try {
    const { assetId } = req.params;
    const { remarks } = req.body;

    if (!req.user || !req.user.user_id) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const result = await workflowService.processTransition(
      assetId,
      req.user.user_id,
      expectedStatus,
      newStatus,
      remarks
    );

    res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    if (error.message === 'Land asset not found') {
      res.status(404).json({ status: 'error', message: error.message });
      return;
    }
    if (error.message.startsWith('Invalid state transition')) {
      res.status(400).json({ status: 'error', message: error.message });
      return;
    }
    next(error);
  }
};

export const submitAsset = (req: Request, res: Response, next: NextFunction) => {
  return handleTransition(req, res, next, AssetStatus.DRAFT, AssetStatus.SUBMITTED);
};

export const reviewAsset = (req: Request, res: Response, next: NextFunction) => {
  return handleTransition(req, res, next, AssetStatus.SUBMITTED, AssetStatus.UNDER_REVIEW);
};

export const approveAsset = (req: Request, res: Response, next: NextFunction) => {
  return handleTransition(req, res, next, AssetStatus.UNDER_REVIEW, AssetStatus.APPROVED);
};

export const rejectAsset = (req: Request, res: Response, next: NextFunction) => {
  return handleTransition(req, res, next, AssetStatus.UNDER_REVIEW, AssetStatus.REJECTED);
};

export const resubmitAsset = (req: Request, res: Response, next: NextFunction) => {
  return handleTransition(req, res, next, AssetStatus.REJECTED, AssetStatus.SUBMITTED);
};
