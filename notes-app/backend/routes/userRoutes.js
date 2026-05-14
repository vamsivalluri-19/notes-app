import express from 'express';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import { getStudents } from '../controllers/userController.js';

const router = express.Router();

router.get('/students', authMiddleware, requireRole('staff'), getStudents);

export default router;