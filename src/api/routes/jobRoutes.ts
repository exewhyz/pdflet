import { Router } from 'express';
import { listJobs, getJob, getBulkJobs } from '../controllers/jobController.js';
import apiKeyAuth from '../../middleware/apiKeyAuth.js';

const router = Router();

router.get('/jobs', apiKeyAuth, listJobs as never);
router.get('/job/:id', apiKeyAuth, getJob as never);
router.get('/jobs/bulk/:bulkJobId', apiKeyAuth, getBulkJobs as never);

export default router;
