import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { authenticate, authorize } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { categorySchema } from '../utils/schemas';
import { Role } from '@prisma/client';

const categoryRouter = Router();

categoryRouter.get('/', authenticate, CategoryController.list);
categoryRouter.get('/:id', authenticate, CategoryController.get);
categoryRouter.post('/', authenticate, authorize([Role.ADMIN]), validateBody(categorySchema), CategoryController.create);
categoryRouter.put('/:id', authenticate, authorize([Role.ADMIN]), validateBody(categorySchema), CategoryController.update);
categoryRouter.delete('/:id', authenticate, authorize([Role.ADMIN]), CategoryController.delete);

export default categoryRouter;
