import { Router } from 'express';
import {
  healthCheck,
  metrics,
  logs,
  alerts,
  acknowledge
} from '../controllers/monitoring.controller.js';

const router = Router();

router.get('/health', healthCheck);
router.get('/metrics', metrics);
router.get('/logs', logs);
router.get('/alerts', alerts);
router.post('/alerts/ack', acknowledge);

export default router;
