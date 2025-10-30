import { Router } from 'express';
import { exportTelemetry } from '../controllers/telemetry.controller.js';

const router = Router();

router.get('/raw', exportTelemetry);

export default router;
