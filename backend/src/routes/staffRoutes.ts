import { Router } from 'express';
import { StaffController } from '../controllers/StaffController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', StaffController.getStaffs);
router.post('/', StaffController.createStaff);
router.put('/:id', StaffController.updateStaff);
router.delete('/:id', StaffController.deleteStaff);

export default router;
