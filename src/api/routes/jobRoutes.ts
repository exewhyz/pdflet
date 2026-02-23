import { Router } from 'express';
import { getJob, getBulkJobs } from '../controllers/jobController.js';
import apiKeyAuth from '../../middleware/apiKeyAuth.js';

const router = Router();

router.get('/job/:id', apiKeyAuth, getJob as never);
router.get('/jobs/bulk/:bulkJobId', apiKeyAuth, getBulkJobs as never);

export default router;
