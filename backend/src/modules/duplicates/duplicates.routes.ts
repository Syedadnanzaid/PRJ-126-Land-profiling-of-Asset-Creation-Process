import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { checkDuplicateController, reviewDuplicateController } from './duplicates.controller';
import { Role } from '@prisma/client';

export const duplicateRoutes = Router();
export const applicationDuplicateRoutes = Router({ mergeParams: true });

duplicateRoutes.use(authenticate);
applicationDuplicateRoutes.use(authenticate);

applicationDuplicateRoutes.post(
    '/check',
    authorize(Role.VERIFICATION_OFFICER, Role.ADMIN),
    checkDuplicateController
);

duplicateRoutes.patch(
    '/:flagId/review',
    authorize(Role.VERIFICATION_OFFICER, Role.APPROVING_AUTHORITY, Role.ADMIN),
    reviewDuplicateController
);