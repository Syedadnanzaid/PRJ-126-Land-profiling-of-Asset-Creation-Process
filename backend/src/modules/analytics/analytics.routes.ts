import { Router } from 'express';
import * as analyticsController from './analytics.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboard);

export default router;
