import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/auth';
import * as workflowController from './workflow.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Asset specific workflow routes (will be mounted at /api/assets/:assetId/workflow)
router.post(
  '/submit',
  authorize(Role.CREATOR),
  workflowController.submitAsset
);

router.post(
  '/review',
  authorize(Role.REVIEWER, Role.ADMIN),
  workflowController.reviewAsset
);

router.post(
  '/approve',
  authorize(Role.REVIEWER, Role.ADMIN),
  workflowController.approveAsset
);

router.post(
  '/reject',
  authorize(Role.REVIEWER, Role.ADMIN),
  workflowController.rejectAsset
);

router.post(
  '/resubmit',
  authorize(Role.CREATOR),
  workflowController.resubmitAsset
);

export default router;
