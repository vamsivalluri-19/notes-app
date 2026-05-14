import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadFile, listFiles, listStaffFiles, toggleVisibility, generateShare, getByShareToken, addComment, incrementDownload, getActivity } from '../controllers/fileController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

// public listing for students (supports pagination & search)
router.get('/public', authMiddleware, listFiles);

// staff upload (visible flag optional)
router.post('/upload', authMiddleware, requireRole('staff'), upload.single('file'), uploadFile);

// staff list their files (supports pagination & search)
router.get('/mine', authMiddleware, requireRole('staff'), listStaffFiles);

// toggle visibility (staff only)
router.post('/:id/toggle-visibility', authMiddleware, requireRole('staff'), toggleVisibility);

// generate share link
router.post('/:id/share', authMiddleware, requireRole('staff'), generateShare);

// download by share token (no auth)
router.get('/shared/:token', getByShareToken);

// comments on file (students or staff)
router.post('/:id/comment', authMiddleware, addComment);

// increment download (auth)
router.post('/:id/download', authMiddleware, incrementDownload);

// activity log
router.get('/:id/activity', authMiddleware, requireRole('staff'), getActivity);

export default router;
