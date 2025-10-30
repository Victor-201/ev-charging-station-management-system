import { Router } from 'express';
import { getDashboards, postDashboard } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/', getDashboards);
router.post('/', postDashboard);

export default router;
