import { Router } from 'express';
import authRouter from './auth';
import categoryRouter from './categories';
import assetRouter from './assets';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/assets', assetRouter);

export default apiRouter;
