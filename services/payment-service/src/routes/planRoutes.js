import express from 'express';
import * as PlanController from '../controllers/PlanController.js';

const router = express.Router();

router.get('/', PlanController.listAll);
router.get('/:id', PlanController.getById);
router.post('/', PlanController.create);

export default router;
