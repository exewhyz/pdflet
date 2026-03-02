import { Router } from 'express';
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
router.get('/projects', listProjects as unknown as import('express').RequestHandler);
router.post('/projects', createProject as unknown as import('express').RequestHandler);

// Authenticated routes (require API key of the project)
router.get(
  '/project',
  apiKeyAuth as unknown as import('express').RequestHandler,
  getProject as unknown as import('express').RequestHandler,
);
router.put(
  '/project',
  apiKeyAuth as unknown as import('express').RequestHandler,
  updateProject as unknown as import('express').RequestHandler,
);
router.delete(
  '/project',
  apiKeyAuth as unknown as import('express').RequestHandler,
  deleteProject as unknown as import('express').RequestHandler,
);

export default router;
