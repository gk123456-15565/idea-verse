import { Request, Response } from 'express';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { Comment } from '../models/Comment';
import { Like } from '../models/Like';
import { Notification } from '../models/Notification';
import { isConnectedToMongo } from '../config/db';
import { localStore, DataPost } from '../utils/dataStore';
import { AuthRequest } from '../middleware/auth';

export async function getPosts(req: Request, res: Response): Promise<void> {
  try {
    const { category, search, author, sort } = req.query;

    if (isConnectedToMongo) {
      const query: any = {};

      if (category && category !== 'All') {
        query.category = category;
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ title: regex }, { description: regex }, { tags: regex }];
      }

      if (author) {
        query.author = author;
      }

      let sortOption: any = { createdAt: -1 };
      if (sort === 'popular') {
        sortOption = { likesCount: -1, createdAt: -1 };
      } else if (sort === 'trending') {
        sortOption = { commentsCount: -1, likesCount: -1 };
      }

      const posts = await Post.find(query)
        .populate('author', 'name username avatar bio')
        .sort(sortOption)
        .lean();

      res.json({
        success: true,
        count: posts.length,
        posts,
      });
    } else {
      let filtered = [...localStore.posts];

      if (category && category !== 'All') {
        filtered = filtered.filter((p) => p.category.toLowerCase() === (category as string).toLowerCase());
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const s = search.trim().toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(s) ||
            p.description.toLowerCase().includes(s) ||
            p.tags.some((t) => t.toLowerCase().includes(s))
        );
      }

      if (author) {
        filtered = filtered.filter((p) => {
          const aId = typeof p.author === 'object' ? p.author._id : p.author;
          return aId.toString() === author.toString();
        });
      }

      if (sort === 'popular') {
        filtered.sort((a, b) => b.likesCount - a.likesCount || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sort === 'trending') {
        filtered.sort((a, b) => (b.commentsCount + b.likesCount) - (a.commentsCount + a.likesCount));
      } else {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      const populated = filtered.map((p) => localStore.populatePostAuthor(p));

      res.json({
        success: true,
        count: populated.length,
        posts: populated,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function getPostById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (isConnectedToMongo) {
      const post = await Post.findById(id).populate('author', 'name username avatar bio');
      if (!post) {
        res.status(404).json({ success: false, message: 'Idea not found' });
        return;
      }
      res.json({ success: true, post });
    } else {
      const post = localStore.posts.find((p) => p._id.toString() === id);
      if (!post) {
        res.status(404).json({ success: false, message: 'Idea not found' });
        return;
      }
      res.json({ success: true, post: localStore.populatePostAuthor(post) });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createPost(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { title, description, category, tags } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ success: false, message: 'Idea title is required.' });
      return;
    }

    if (!description || !description.trim()) {
      res.status(400).json({ success: false, message: 'Idea description is required.' });
      return;
    }

    let parsedTags: string[] = [];
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    } else if (Array.isArray(tags)) {
      parsedTags = tags.map((t) => String(t).trim()).filter(Boolean);
    }

    let imagePath = '';
    if (req.file) {
      imagePath = `/uploads/posts/${req.file.filename}`;
    } else if (req.body.imageUrl && typeof req.body.imageUrl === 'string') {
      imagePath = req.body.imageUrl.trim();
    }

    if (isConnectedToMongo) {
      const newPost = await Post.create({
        title: title.trim(),
        description: description.trim(),
        category: category || 'Innovation',
        image: imagePath,
        author: req.user.id,
        tags: parsedTags,
        likes: [],
        likesCount: 0,
        commentsCount: 0,
      });

      const populatedPost = await Post.findById(newPost._id).populate('author', 'name username avatar bio');

      res.status(201).json({
        success: true,
        message: 'Idea published to the IDEAVERSE successfully!',
        post: populatedPost,
      });
    } else {
      const newPost: DataPost = {
        _id: 'post_' + Date.now() + Math.random().toString(36).substring(2, 6),
        title: title.trim(),
        description: description.trim(),
        category: category || 'Innovation',
        image: imagePath,
        author: req.user.id,
        tags: parsedTags,
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStore.posts.unshift(newPost);

      res.status(201).json({
        success: true,
        message: 'Idea published to the IDEAVERSE successfully!',
        post: localStore.populatePostAuthor(newPost),
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function updatePost(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { title, description, category, tags } = req.body;

    let parsedTags: string[] | undefined;
    if (tags) {
      if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags.map((t) => String(t).trim()).filter(Boolean);
      }
    }

    if (isConnectedToMongo) {
      const post = await Post.findById(id);
      if (!post) {
        res.status(404).json({ success: false, message: 'Idea not found' });
        return;
      }

      // Verify ownership
      if (post.author.toString() !== req.user.id) {
        res.status(403).json({ success: false, message: 'Forbidden: You can only edit your own ideas.' });
        return;
      }

      if (title) post.title = title.trim();
      if (description) post.description = description.trim();
      if (category) post.category = category;
      if (parsedTags) post.tags = parsedTags;
      if (req.file) {
        post.image = `/uploads/posts/${req.file.filename}`;
      } else if (req.body.imageUrl !== undefined) {
        post.image = req.body.imageUrl;
      }

      await post.save();
      const updated = await Post.findById(post._id).populate('author', 'name username avatar bio');

      res.json({
        success: true,
        message: 'Idea updated successfully!',
        post: updated,
      });
    } else {
      const postIndex = localStore.posts.findIndex((p) => p._id.toString() === id);
      if (postIndex === -1) {
        res.status(404).json({ success: false, message: 'Idea not found' });
        return;
      }

      const post = localStore.posts[postIndex];
      const authorId = typeof post.author === 'object' ? post.author._id : post.author;
      if (authorId.toString() !== req.user.id) {
        res.status(403).json({ success: false, message: 'Forbidden: You can only edit your own ideas.' });
        return;
      }

      if (title) post.title = title.trim();
      if (description) post.description = description.trim();
      if (category) post.category = category;
      if (parsedTags) post.tags = parsedTags;
      if (req.file) {
        post.image = `/uploads/posts/${req.file.filename}`;
      } else if (req.body.imageUrl !== undefined) {
        post.image = req.body.imageUrl;
      }
      post.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        message: 'Idea updated successfully!',
        post: localStore.populatePostAuthor(post),
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function deletePost(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    if (isConnectedToMongo) {
      const post = await Post.findById(id);
      if (!post) {
        res.status(404).json({ success: false, message: 'Idea not found' });
        return;
      }

      // Verify ownership
      if (post.author.toString() !== req.user.id) {
        res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own ideas.' });
        return;
      }

      await Post.findByIdAndDelete(id);
      await Comment.deleteMany({ post: id });
      await Like.deleteMany({ post: id });
      await Notification.deleteMany({ post: id });

      res.json({ success: true, message: 'Idea deleted successfully' });
    } else {
      const postIndex = localStore.posts.findIndex((p) => p._id.toString() === id);
      if (postIndex === -1) {
        res.status(404).json({ success: false, message: 'Idea not found' });
        return;
      }

      const post = localStore.posts[postIndex];
      const authorId = typeof post.author === 'object' ? post.author._id : post.author;
      if (authorId.toString() !== req.user.id) {
        res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own ideas.' });
        return;
      }

      localStore.posts.splice(postIndex, 1);
      localStore.comments = localStore.comments.filter((c) => c.post.toString() !== id);
      localStore.likes = localStore.likes.filter((l) => l.post.toString() !== id);
      localStore.notifications = localStore.notifications.filter((n) => !n.post || (typeof n.post === 'object' ? n.post._id : n.post).toString() !== id);

      res.json({ success: true, message: 'Idea deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function getUserPosts(req: Request, res: Response): Promise<void> {
  try {
    const { username } = req.params;

    if (isConnectedToMongo) {
      const user = await User.findOne({ username: username.toLowerCase() });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const posts = await Post.find({ author: user._id })
        .populate('author', 'name username avatar bio')
        .sort({ createdAt: -1 })
        .lean();

      res.json({ success: true, posts });
    } else {
      const user = localStore.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const posts = localStore.posts
        .filter((p) => {
          const aId = typeof p.author === 'object' ? p.author._id : p.author;
          return aId.toString() === user._id.toString();
        })
        .map((p) => localStore.populatePostAuthor(p));

      res.json({ success: true, posts });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}
