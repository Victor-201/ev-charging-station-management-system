import express from 'express';
import * as PlanController from '../controllers/PlanController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'user'), PlanController.listAll);
router.get('/:id', authorize('admin', 'user'), PlanController.getById);
router.post('/', authorize('admin'), PlanController.create);
router.put('/:id', authorize('admin'), PlanController.update);
router.delete('/:id', authorize('admin'), PlanController.remove);

export default router;
