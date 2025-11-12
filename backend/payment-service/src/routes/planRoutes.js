import express from 'express';
import * as PlanController from '../controllers/PlanController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { UserRole } from '../constants/roles.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize(UserRole.ADMIN, UserRole.USER), PlanController.listAll);
router.get('/:id', authorize(UserRole.ADMIN, UserRole.USER), PlanController.getById);
router.post('/', authorize(UserRole.ADMIN), PlanController.create);
router.put('/:id', authorize(UserRole.ADMIN), PlanController.update);
router.delete('/:id', authorize(UserRole.ADMIN), PlanController.remove);

export default router;
