import { Router } from 'express';
import type { RequestHandler } from 'express';
import apiKeyAuth from '../../middleware/apiKeyAuth.js';
import {
  getProject,
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';

const router = Router();

// Public routes (dashboard admin — no API key needed)
router.get('/projects', listProjects as unknown as RequestHandler);
router.post('/projects', createProject as unknown as RequestHandler);

// Authenticated routes (require API key of the project)
router.get(
  '/project',
  apiKeyAuth as unknown as RequestHandler,
  getProject as unknown as RequestHandler,
);
router.put(
  '/project',
  apiKeyAuth as unknown as RequestHandler,
  updateProject as unknown as RequestHandler,
);
router.delete(
  '/project',
  apiKeyAuth as unknown as RequestHandler,
  deleteProject as unknown as RequestHandler,
);

export default router;
