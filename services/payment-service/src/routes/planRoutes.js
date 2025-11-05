// routes/planRoutes.js
import express from 'express';
import * as PlanController from '../controllers/PlanController.js';

const router = express.Router();

// === Routes cho Plan ===
router.get('/', PlanController.listAll);
router.get('/:id', PlanController.getById);
router.post('/', PlanController.create);
router.put('/:id', PlanController.update);
router.delete('/:id', PlanController.remove);

export default router;
