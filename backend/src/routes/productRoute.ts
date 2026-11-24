import { Router } from 'express';
import { createProduct, listProducts } from '../controllers/productController.js';
import { authenticate, requireRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, listProducts);
router.post('/', authenticate, requireRoles('ADMIN'), createProduct);

export default router;