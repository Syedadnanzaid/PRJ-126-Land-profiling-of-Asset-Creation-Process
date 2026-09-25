import { Router } from 'express';
import * as applicationsController from './applications.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// APPLICANT only routes
router.post('/', authorize('APPLICANT'), applicationsController.createApplication);
router.get('/', authorize('APPLICANT', 'VERIFICATION_OFFICER', 'APPROVING_AUTHORITY', 'ADMIN'), applicationsController.getApplications);
router.patch('/:applicationId', authorize('APPLICANT'), applicationsController.updateApplication);

// Approval Statistics
router.get('/approval-stats', authorize('APPROVING_AUTHORITY', 'ADMIN'), applicationsController.getApprovalStats);

// Authorized view (roles check inside controller logic for APPLICANT)
router.get('/:applicationId', authorize('APPLICANT', 'VERIFICATION_OFFICER', 'APPROVING_AUTHORITY', 'ADMIN'), applicationsController.getApplicationById);

export default router;
