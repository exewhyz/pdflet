import { Router } from 'express';
import { generateOne, bulkGenerate } from '../controllers/generateController.js';
import apiKeyAuth from '../../middleware/apiKeyAuth.js';

const router = Router();

router.post('/generate/:templateSlug', apiKeyAuth, generateOne as never);
router.post('/bulk-generate/:templateSlug', apiKeyAuth, bulkGenerate as never);

export default router;
