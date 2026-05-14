import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    req.userRole = payload.role || 'student';
    req.user = await User.findById(req.userId).select('-password');
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.userRole) return res.status(403).json({ message: 'Forbidden' });
  if (req.userRole !== role) return res.status(403).json({ message: 'Forbidden' });
  next();
};

export { authMiddleware, requireRole };
