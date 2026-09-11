import { Response } from 'express';
import { Post } from '../models/Post';
import { Like } from '../models/Like';
import { Notification } from '../models/Notification';
import { isConnectedToMongo } from '../config/db';
import { localStore } from '../utils/dataStore';
import { AuthRequest } from '../middleware/auth';

export async function toggleLike(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { postId } = req.params;
    const userId = req.user.id;

    if (isConnectedToMongo) {
      const post = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ success: false, message: 'Idea not found' });
        return;
      }

      const existingLike = await Like.findOne({ post: postId, user: userId });

      if (existingLike) {
        // Unlike
        await Like.findByIdAndDelete(existingLike._id);
        await Post.findByIdAndUpdate(postId, {
          $pull: { likes: userId },
          $inc: { likesCount: -1 },
        });

        const updatedPost = await Post.findById(postId);
        res.json({
          success: true,
          liked: false,
          likesCount: Math.max(0, updatedPost?.likesCount || 0),
          message: 'Idea unliked',
        });
      } else {
        // Like without duplicates
        await Like.create({ post: postId, user: userId });
        await Post.findByIdAndUpdate(postId, {
          $addToSet: { likes: userId },
          $inc: { likesCount: 1 },
        });

        // Create notification for idea author if not self
        const authorIdStr = post.author.toString();
        if (authorIdStr !== userId) {
          await Notification.create({
            recipient: post.author,
            sender: userId,
            type: 'like',
            post: postId,
            text: `liked your idea "${post.title}"`,
          });
        }

        const updatedPost = await Post.findById(postId);
        res.json({
          success: true,
          liked: true,
          likesCount: updatedPost?.likesCount || 1,
          message: 'Idea liked!',
        });
      }
    } else {
      const post = localStore.posts.find((p) => p._id.toString() === postId);
      if (!post) {
        res.status(404).json({ success: false, message: 'Idea not found' });
        return;
      }

      const existingLikeIndex = localStore.likes.findIndex(
        (l) => l.post.toString() === postId && l.user.toString() === userId
      );

      if (existingLikeIndex !== -1) {
        // Unlike
        localStore.likes.splice(existingLikeIndex, 1);
        post.likes = post.likes.filter((id) => id.toString() !== userId);
        post.likesCount = Math.max(0, post.likes.length);

        res.json({
          success: true,
          liked: false,
          likesCount: post.likesCount,
          message: 'Idea unliked',
        });
      } else {
        // Like
        localStore.likes.push({
          _id: 'like_' + Date.now(),
          post: postId,
          user: userId,
          createdAt: new Date().toISOString(),
        });

        if (!post.likes.includes(userId)) {
          post.likes.push(userId);
        }
        post.likesCount = post.likes.length;

        const authorIdStr = (typeof post.author === 'object' ? post.author._id : post.author).toString();
        if (authorIdStr !== userId) {
          localStore.notifications.unshift({
            _id: 'notif_' + Date.now(),
            recipient: authorIdStr,
            sender: userId,
            type: 'like',
            post: postId,
            text: `liked your idea "${post.title}"`,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }

        res.json({
          success: true,
          liked: true,
          likesCount: post.likesCount,
          message: 'Idea liked!',
        });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function getPostLikes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { postId } = req.params;
    const currentUserId = req.user?.id;

    if (isConnectedToMongo) {
      const likes = await Like.find({ post: postId }).populate('user', 'name username avatar bio');
      const isLikedByCurrentUser = currentUserId
        ? !!(await Like.findOne({ post: postId, user: currentUserId }))
        : false;

      res.json({
        success: true,
        count: likes.length,
        isLikedByCurrentUser,
        likes,
      });
    } else {
      const likes = localStore.likes.filter((l) => l.post.toString() === postId);
      const isLikedByCurrentUser = currentUserId
        ? likes.some((l) => l.user.toString() === currentUserId)
        : false;

      const populatedLikes = likes.map((l) => {
        const u = localStore.users.find((user) => user._id.toString() === l.user.toString());
        return {
          ...l,
          user: u ? { _id: u._id, name: u.name, username: u.username, avatar: u.avatar, bio: u.bio } : null,
        };
      });

      res.json({
        success: true,
        count: likes.length,
        isLikedByCurrentUser,
        likes: populatedLikes,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}
