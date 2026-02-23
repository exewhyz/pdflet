import { Router } from 'express';
import multer from 'multer';
import { marketplace, createTemplate, uploadPreview } from '../controllers/templateController.js';
import apiKeyAuth from '../../middleware/apiKeyAuth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

router.get('/marketplace/templates', marketplace);
router.post('/templates', apiKeyAuth, createTemplate as never);
router.post(
  '/templates/upload-preview',
  apiKeyAuth,
  upload.single('image'),
  uploadPreview as never,
);

export default router;
