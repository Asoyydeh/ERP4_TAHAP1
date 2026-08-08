import { Router } from 'express';
import { WorkReportController } from '../controllers/WorkReportController';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';

import { upload } from '../middlewares/upload';

const workReportRouter = Router();

workReportRouter.post('/', authenticate, (req, res, next) => { req.params.fileType = 'work_reports'; next(); }, upload.single('attachment'), WorkReportController.create);
workReportRouter.get('/my-reports', authenticate, WorkReportController.getMyReports);
workReportRouter.get('/all', authenticate, authorize([Role.SUPERADMIN, Role.HRD]), WorkReportController.getAllReports);

export default workReportRouter;
