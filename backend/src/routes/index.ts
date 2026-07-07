import { Router } from 'express';
import authRouter from './auth';
import projectRouter from './projects';
import documentRouter from './documents';
import monitoringRouter from './monitoring';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/documents', documentRouter);
apiRouter.use('/monitoring', monitoringRouter);

export default apiRouter;
