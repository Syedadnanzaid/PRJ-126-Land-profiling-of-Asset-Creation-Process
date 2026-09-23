import { Router } from 'express';
import assetsRoutes from '../modules/assets/assets.routes';
import authRoutes from '../modules/auth/auth.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';
import { duplicateRoutes, applicationDuplicateRoutes } from '../modules/duplicates/duplicates.routes';
import { documentRoutes, applicationDocumentRoutes } from '../modules/documents/documents.routes';
import workflowRoutes from '../modules/workflow/workflow.routes';
import applicationsRoutes from '../modules/applications/applications.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/assets', assetsRoutes);
router.use('/applications', applicationsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/duplicates', duplicateRoutes);
router.use('/documents', documentRoutes);
router.use('/applications/:applicationId/workflow', workflowRoutes);
router.use('/applications/:applicationId/documents', applicationDocumentRoutes);
router.use('/applications/:applicationId/duplicates', applicationDuplicateRoutes);

export default router;