import { Router } from 'express';
import { createOrder, listOrders, cancelOrder } from '../controllers/orderController.js';
import {
  authenticate,
  requireCreateAccess,
} from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, listOrders);
router.post('/', authenticate, requireCreateAccess, createOrder);
router.post('/:id/cancel', authenticate, cancelOrder);

export default router;