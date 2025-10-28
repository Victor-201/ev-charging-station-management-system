import { Router } from 'express';
import {
  userMonthly,
  stationDaily,
  revenueReport,
  forecastTrain,
  stationForecast
} from '../controllers/analytics.controller.js';

const router = Router();

router.get('/reports/user/:user_id/monthly', userMonthly);
router.get('/reports/station/:station_id/daily', stationDaily);
router.get('/reports/revenue', revenueReport);
router.post('/forecast/train', forecastTrain);
router.get('/forecast/:station_id', stationForecast);

export default router;
