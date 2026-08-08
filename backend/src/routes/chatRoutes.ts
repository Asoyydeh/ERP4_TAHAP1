import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

router.use(authenticate);

router.get('/contacts', ChatController.getContacts);
router.get('/messages', ChatController.getMessages);
router.get('/unread-count', ChatController.getUnreadCount);
router.post('/send', ChatController.sendMessage);
router.put('/mark-read', ChatController.markAsRead);
router.post('/upload', upload.single('file'), ChatController.uploadFile);
router.get('/attachment/:filename', ChatController.downloadAttachment);

export default router;
