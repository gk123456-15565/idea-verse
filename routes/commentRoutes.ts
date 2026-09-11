import { Router } from 'express';
import { getComments, addComment, deleteComment } from '../controllers/commentController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/post/:postId', getComments);
router.post('/post/:postId', protect, addComment);
router.delete('/:id', protect, deleteComment);

export default router;
