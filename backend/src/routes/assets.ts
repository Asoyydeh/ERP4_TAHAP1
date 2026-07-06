import { Router } from 'express';
import { AssetController } from '../controllers/AssetController';
import { authenticate, authorize } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { assetCreateSchema, assetUpdateSchema } from '../utils/schemas';
import { Role } from '@prisma/client';

const assetRouter = Router();

// Sub-routes khusus (taruh di atas /:id agar tidak disangka ID)
assetRouter.get('/dashboard', authenticate, AssetController.dashboard);
assetRouter.get('/logs', authenticate, AssetController.logs);
assetRouter.get('/export-pdf', authenticate, authorize([Role.ADMIN]), AssetController.exportPdf);

// CRUD Utama
assetRouter.get('/', authenticate, AssetController.list);
assetRouter.get('/:id', authenticate, AssetController.get);
assetRouter.post('/', authenticate, authorize([Role.ADMIN]), validateBody(assetCreateSchema), AssetController.create);
assetRouter.put('/:id', authenticate, authorize([Role.ADMIN, Role.STAFF]), validateBody(assetUpdateSchema), AssetController.update);
assetRouter.delete('/:id', authenticate, authorize([Role.ADMIN]), AssetController.delete);

export default assetRouter;
