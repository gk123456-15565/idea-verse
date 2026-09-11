import { Router } from 'express';
import { register, login, googleAuth, getMe, logout, getAuthStatus } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/status', getAuthStatus);
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.post('/logout', logout);

export default router;
