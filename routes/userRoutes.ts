import { Router } from 'express';
import {
  getUserProfile,
  updateProfile,
  followUser,
  unfollowUser,
  searchUsers,
} from '../controllers/userController';
import { protect, optionalAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/search', searchUsers);
router.put('/profile/update', protect, upload.single('avatar'), updateProfile);
router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);
router.get('/:username', optionalAuth, getUserProfile);

export default router;
