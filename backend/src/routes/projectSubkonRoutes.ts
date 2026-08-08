import { Router } from 'express';
import { getProjectSubkons, createProjectSubkon, updateProjectSubkon, deleteProjectSubkon } from '../controllers/ProjectSubkonController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/:projectId', getProjectSubkons);
router.post('/:projectId', createProjectSubkon);
router.put('/:id', updateProjectSubkon);
router.delete('/:id', deleteProjectSubkon);

export default router;
