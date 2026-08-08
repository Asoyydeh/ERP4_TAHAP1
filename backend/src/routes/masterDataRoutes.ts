import { Router } from 'express';
import { MasterDataController } from '../controllers/masterDataController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// Companies
router.get('/companies', MasterDataController.getCompanies);
router.post('/companies', MasterDataController.createCompany);
router.put('/companies/:id', MasterDataController.updateCompany);
router.delete('/companies/:id', MasterDataController.deleteCompany);

// Clients
router.get('/clients', MasterDataController.getClients);
router.post('/clients', MasterDataController.createClient);
router.put('/clients/:id', MasterDataController.updateClient);
router.delete('/clients/:id', MasterDataController.deleteClient);

// Subkons
router.get('/subkons', MasterDataController.getSubkons);
router.post('/subkons', MasterDataController.createSubkon);
router.put('/subkons/:id', MasterDataController.updateSubkon);
router.delete('/subkons/:id', MasterDataController.deleteSubkon);

// Numberings (Penomoran Proyek)
router.get('/numberings', MasterDataController.getNumberings);
router.post('/numberings', MasterDataController.createNumbering);
router.put('/numberings/:id', MasterDataController.updateNumbering);
router.delete('/numberings/:id', MasterDataController.deleteNumbering);

export default router;
