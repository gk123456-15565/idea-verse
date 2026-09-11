import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { isConnectedToMongo } from '../config/db';
import { localStore } from '../utils/dataStore';
import { AuthRequest } from '../middleware/auth';

export async function getUserProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.id;

    if (isConnectedToMongo) {
      const user = await User.findOne({ username: username.toLowerCase() }).select('-password');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const isFollowing = currentUserId
        ? user.followers.some((f) => f.toString() === currentUserId)
        : false;

      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          location: user.location,
          followersCount: user.followers.length,
          followingCount: user.following.length,
          createdAt: user.createdAt,
          isFollowing,
        },
      });
    } else {
      const user = localStore.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const isFollowing = currentUserId ? user.followers.includes(currentUserId) : false;

      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          location: user.location,
          followersCount: user.followers.length,
          followingCount: user.following.length,
          createdAt: user.createdAt,
          isFollowing,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { name, bio, website, location, notificationsEnabled, currentPassword, newPassword } = req.body;
    let avatarPath: string | undefined;

    if (req.file) {
      avatarPath = `/uploads/profiles/${req.file.filename}`;
    } else if (req.body.avatarUrl) {
      avatarPath = req.body.avatarUrl;
    }

    if (isConnectedToMongo) {
      const user = await User.findById(req.user.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (name) user.name = name.trim();
      if (bio !== undefined) user.bio = bio.trim();
      if (website !== undefined) user.website = website.trim();
      if (location !== undefined) user.location = location.trim();
      if (avatarPath) user.avatar = avatarPath;
      if (notificationsEnabled !== undefined) {
        user.notificationsEnabled = notificationsEnabled === 'true' || notificationsEnabled === true;
      }

      // Password update if provided
      if (currentPassword && newPassword) {
        if (!user.password) {
          res.status(400).json({ success: false, message: 'This account was created via social login and has no password.' });
          return;
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          res.status(400).json({ success: false, message: 'Current password does not match.' });
          return;
        }
        if (newPassword.length < 6) {
          res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
          return;
        }
        user.password = await bcrypt.hash(newPassword, 10);
      }

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully!',
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          location: user.location,
          notificationsEnabled: user.notificationsEnabled,
          followersCount: user.followers.length,
          followingCount: user.following.length,
        },
      });
    } else {
      const user = localStore.users.find((u) => u._id.toString() === req.user?.id.toString());
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (name) user.name = name.trim();
      if (bio !== undefined) user.bio = bio.trim();
      if (website !== undefined) user.website = website.trim();
      if (location !== undefined) user.location = location.trim();
      if (avatarPath) user.avatar = avatarPath;
      if (notificationsEnabled !== undefined) {
        user.notificationsEnabled = notificationsEnabled === 'true' || notificationsEnabled === true;
      }

      if (currentPassword && newPassword) {
        if (!user.password) {
          res.status(400).json({ success: false, message: 'This account has no password set.' });
          return;
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          res.status(400).json({ success: false, message: 'Current password does not match.' });
          return;
        }
        user.password = await bcrypt.hash(newPassword, 10);
      }

      user.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        message: 'Profile updated successfully!',
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          location: user.location,
          notificationsEnabled: user.notificationsEnabled,
          followersCount: user.followers.length,
          followingCount: user.following.length,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function followUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id: targetUserId } = req.params;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
      return;
    }

    if (isConnectedToMongo) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Add to followers & following
      await User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });

      // Create notification
      await Notification.create({
        recipient: targetUserId,
        sender: currentUserId,
        type: 'follow',
        text: 'started following your ideas',
      });

      const updatedTarget = await User.findById(targetUserId);

      res.json({
        success: true,
        isFollowing: true,
        followersCount: updatedTarget?.followers.length || 1,
        message: `You are now following @${targetUser.username}`,
      });
    } else {
      const targetUser = localStore.users.find((u) => u._id.toString() === targetUserId);
      const currentUser = localStore.users.find((u) => u._id.toString() === currentUserId);

      if (!targetUser || !currentUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (!targetUser.followers.includes(currentUserId)) {
        targetUser.followers.push(currentUserId);
      }
      if (!currentUser.following.includes(targetUserId)) {
        currentUser.following.push(targetUserId);
      }

      localStore.notifications.unshift({
        _id: 'notif_' + Date.now(),
        recipient: targetUserId,
        sender: currentUserId,
        type: 'follow',
        text: 'started following your ideas',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        isFollowing: true,
        followersCount: targetUser.followers.length,
        message: `You are now following @${targetUser.username}`,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function unfollowUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id: targetUserId } = req.params;
    const currentUserId = req.user.id;

    if (isConnectedToMongo) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      await User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });

      const updatedTarget = await User.findById(targetUserId);

      res.json({
        success: true,
        isFollowing: false,
        followersCount: Math.max(0, updatedTarget?.followers.length || 0),
        message: `You unfollowed @${targetUser.username}`,
      });
    } else {
      const targetUser = localStore.users.find((u) => u._id.toString() === targetUserId);
      const currentUser = localStore.users.find((u) => u._id.toString() === currentUserId);

      if (!targetUser || !currentUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      targetUser.followers = targetUser.followers.filter((id) => id !== currentUserId);
      currentUser.following = currentUser.following.filter((id) => id !== targetUserId);

      res.json({
        success: true,
        isFollowing: false,
        followersCount: targetUser.followers.length,
        message: `You unfollowed @${targetUser.username}`,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function searchUsers(req: Request, res: Response): Promise<void> {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      res.json({ success: true, users: [] });
      return;
    }

    const query = q.trim().toLowerCase();

    if (isConnectedToMongo) {
      const users = await User.find({
        $or: [{ name: new RegExp(query, 'i') }, { username: new RegExp(query, 'i') }],
      })
        .select('name username avatar bio followers')
        .limit(10);

      res.json({
        success: true,
        users: users.map((u) => ({
          _id: u._id,
          name: u.name,
          username: u.username,
          avatar: u.avatar,
          bio: u.bio,
          followersCount: u.followers.length,
        })),
      });
    } else {
      const matches = localStore.users
        .filter((u) => u.name.toLowerCase().includes(query) || u.username.toLowerCase().includes(query))
        .slice(0, 10)
        .map((u) => ({
          _id: u._id,
          name: u.name,
          username: u.username,
          avatar: u.avatar,
          bio: u.bio,
          followersCount: u.followers.length,
        }));

      res.json({ success: true, users: matches });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}
