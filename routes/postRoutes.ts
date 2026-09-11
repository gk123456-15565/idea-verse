import { Router } from 'express';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getUserPosts,
} from '../controllers/postController';
import { protect, optionalAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', optionalAuth, getPosts);
router.get('/user/:username', getUserPosts);
router.get('/:id', optionalAuth, getPostById);
router.post('/', protect, upload.single('image'), createPost);
router.put('/:id', protect, upload.single('image'), updatePost);
router.delete('/:id', protect, deletePost);

export default router;
