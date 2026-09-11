import { Response } from 'express';
import { Notification } from '../models/Notification';
import { isConnectedToMongo } from '../config/db';
import { localStore } from '../utils/dataStore';
import { AuthRequest } from '../middleware/auth';

export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const userId = req.user.id;

    if (isConnectedToMongo) {
      const notifications = await Notification.find({ recipient: userId })
        .populate('sender', 'name username avatar')
        .populate('post', 'title')
        .sort({ createdAt: -1 })
        .limit(50);

      const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

      res.json({
        success: true,
        unreadCount,
        notifications,
      });
    } else {
      const userNotifs = localStore.notifications
        .filter((n) => n.recipient.toString() === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const populated = userNotifs.map((n) => {
        const sender = localStore.users.find(
          (u) => u._id.toString() === (typeof n.sender === 'object' ? n.sender._id : n.sender).toString()
        );
        let postObj: any = null;
        if (n.post) {
          const postFound = localStore.posts.find(
            (p) => p._id.toString() === (typeof n.post === 'object' ? n.post._id : n.post).toString()
          );
          if (postFound) {
            postObj = { _id: postFound._id, title: postFound.title };
          }
        }

        return {
          ...n,
          sender: sender
            ? { _id: sender._id, name: sender.name, username: sender.username, avatar: sender.avatar }
            : { _id: 'unknown', name: 'User', username: 'user', avatar: '' },
          post: postObj,
        };
      });

      const unreadCount = populated.filter((n) => !n.isRead).length;

      res.json({
        success: true,
        unreadCount,
        notifications: populated,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    if (isConnectedToMongo) {
      const notification = await Notification.findOneAndUpdate(
        { _id: id, recipient: req.user.id },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      res.json({ success: true, message: 'Notification marked as read' });
    } else {
      const notif = localStore.notifications.find(
        (n) => n._id.toString() === id && n.recipient.toString() === req.user?.id
      );

      if (!notif) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      notif.isRead = true;
      res.json({ success: true, message: 'Notification marked as read' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const userId = req.user.id;

    if (isConnectedToMongo) {
      await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
      res.json({ success: true, message: 'All notifications marked as read' });
    } else {
      localStore.notifications.forEach((n) => {
        if (n.recipient.toString() === userId) {
          n.isRead = true;
        }
      });
      res.json({ success: true, message: 'All notifications marked as read' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function deleteNotification(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    if (isConnectedToMongo) {
      await Notification.findOneAndDelete({ _id: id, recipient: req.user.id });
      res.json({ success: true, message: 'Notification deleted' });
    } else {
      const idx = localStore.notifications.findIndex(
        (n) => n._id.toString() === id && n.recipient.toString() === req.user?.id
      );
      if (idx !== -1) {
        localStore.notifications.splice(idx, 1);
      }
      res.json({ success: true, message: 'Notification deleted' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}
