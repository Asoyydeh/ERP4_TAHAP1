import { Router } from 'express';
import authRouter from './auth';
import projectRouter from './projects';
import documentRouter from './documents';
import monitoringRouter from './monitoring';
import attendanceRouter from './attendance';
import workReportRouter from './workReports';
import masterDataRouter from './masterDataRoutes';
import staffRouter from './staffRoutes';
import projectSubkonRouter from './projectSubkonRoutes';
import chatRouter from './chatRoutes';
import companyDocumentRouter from './companyDocumentRoutes';
import gaDocumentRouter from './gaDocumentRoutes';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/documents', documentRouter);
apiRouter.use('/monitoring', monitoringRouter);
apiRouter.use('/attendance', attendanceRouter);
apiRouter.use('/work-reports', workReportRouter);
apiRouter.use('/master-data', masterDataRouter);
apiRouter.use('/staff', staffRouter);
apiRouter.use('/project-subkons', projectSubkonRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/company-documents', companyDocumentRouter);
apiRouter.use('/ga-documents', gaDocumentRouter);

export default apiRouter;

