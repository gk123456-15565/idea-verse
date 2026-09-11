import { Request, Response } from 'express';
import { Comment } from '../models/Comment';
import { Post } from '../models/Post';
import { Notification } from '../models/Notification';
import { isConnectedToMongo } from '../config/db';
import { localStore, DataComment } from '../utils/dataStore';
import { AuthRequest } from '../middleware/auth';

export async function getComments(req: Request, res: Response): Promise<void> {
  try {
    const { postId } = req.params;

    if (isConnectedToMongo) {
      const comments = await Comment.find({ post: postId })
        .populate('author', 'name username avatar')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: comments.length, comments });
    } else {
      const comments = localStore.comments
        .filter((c) => c.post.toString() === postId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((c) => localStore.populateCommentAuthor(c));

      res.json({ success: true, count: comments.length, comments });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function addComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { postId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ success: false, message: 'Comment text cannot be empty' });
      return;
    }

    if (isConnectedToMongo) {
      const post = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ success: false, message: 'Idea not found' });
        return;
      }

      const comment = await Comment.create({
        post: postId,
        author: req.user.id,
        text: text.trim(),
      });

      await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

      const populatedComment = await Comment.findById(comment._id).populate('author', 'name username avatar');

      // Notify post author if not self
      const authorIdStr = post.author.toString();
      if (authorIdStr !== req.user.id) {
        await Notification.create({
          recipient: post.author,
          sender: req.user.id,
          type: 'comment',
          post: postId,
          text: `commented on your idea "${post.title}": "${text.trim().substring(0, 50)}${text.trim().length > 50 ? '...' : ''}"`,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        comment: populatedComment,
      });
    } else {
      const post = localStore.posts.find((p) => p._id.toString() === postId);
      if (!post) {
        res.status(404).json({ success: false, message: 'Idea not found' });
        return;
      }

      const newComment: DataComment = {
        _id: 'comm_' + Date.now() + Math.random().toString(36).substring(2, 6),
        post: postId,
        author: req.user.id,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStore.comments.unshift(newComment);
      post.commentsCount = (post.commentsCount || 0) + 1;

      const authorIdStr = (typeof post.author === 'object' ? post.author._id : post.author).toString();
      if (authorIdStr !== req.user.id) {
        localStore.notifications.unshift({
          _id: 'notif_' + Date.now(),
          recipient: authorIdStr,
          sender: req.user.id,
          type: 'comment',
          post: postId,
          text: `commented on your idea "${post.title}"`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        comment: localStore.populateCommentAuthor(newComment),
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    if (isConnectedToMongo) {
      const comment = await Comment.findById(id);
      if (!comment) {
        res.status(404).json({ success: false, message: 'Comment not found' });
        return;
      }

      if (comment.author.toString() !== req.user.id) {
        res.status(403).json({ success: false, message: 'You can only delete your own comments.' });
        return;
      }

      await Comment.findByIdAndDelete(id);
      await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

      res.json({ success: true, message: 'Comment deleted successfully' });
    } else {
      const commentIndex = localStore.comments.findIndex((c) => c._id.toString() === id);
      if (commentIndex === -1) {
        res.status(404).json({ success: false, message: 'Comment not found' });
        return;
      }

      const comment = localStore.comments[commentIndex];
      const authorId = typeof comment.author === 'object' ? comment.author._id : comment.author;
      if (authorId.toString() !== req.user.id) {
        res.status(403).json({ success: false, message: 'You can only delete your own comments.' });
        return;
      }

      const postId = comment.post.toString();
      localStore.comments.splice(commentIndex, 1);

      const post = localStore.posts.find((p) => p._id.toString() === postId);
      if (post) {
        post.commentsCount = Math.max(0, (post.commentsCount || 1) - 1);
      }

      res.json({ success: true, message: 'Comment deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}
