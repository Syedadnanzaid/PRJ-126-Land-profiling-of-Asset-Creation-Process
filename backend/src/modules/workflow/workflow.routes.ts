import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/auth';
import * as workflowController from './workflow.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Application specific workflow routes (will be mounted at /api/applications/:applicationId/workflow)

router.post(
  '/submit',
  authorize(Role.APPLICANT),
  workflowController.submitApplication
);

router.post(
  '/verify/start',
  authorize(Role.VERIFICATION_OFFICER),
  workflowController.startVerification
);

router.post(
  '/verify/request-correction',
  authorize(Role.VERIFICATION_OFFICER),
  workflowController.requestCorrection
);

router.post(
  '/resubmit',
  authorize(Role.APPLICANT),
  workflowController.resubmitApplication
);

router.post(
  '/verify/complete',
  authorize(Role.VERIFICATION_OFFICER),
  workflowController.completeVerification
);

// We won't restrict this too tightly, maybe VERIFICATION_OFFICER triggers it after completing, or it's automated.
// For now, let VERIFICATION_OFFICER push it to the final stage, or maybe ADMIN. The instructions said:
// "If the existing architecture provides a sensible actor... Otherwise implement it as a controlled backend transition"
// I will allow VERIFICATION_OFFICER to request approval (moving it to PENDING_APPROVAL).
router.post(
  '/approval/request',
  authorize(Role.VERIFICATION_OFFICER, Role.ADMIN),
  workflowController.requestApproval
);

router.post(
  '/approval/approve',
  authorize(Role.APPROVING_AUTHORITY),
  workflowController.finalApprove
);

router.post(
  '/approval/reject',
  authorize(Role.APPROVING_AUTHORITY),
  workflowController.finalReject
);

export default router;
