import { Router } from 'express';
import { toggleLike, getPostLikes } from '../controllers/likeController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/post/:postId', protect, toggleLike);
router.get('/post/:postId', optionalAuth, getPostLikes);

export default router;
