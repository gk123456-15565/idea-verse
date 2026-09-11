import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { User } from '../models/User';
import { isConnectedToMongo } from '../config/db';
import { localStore } from '../utils/dataStore';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    name?: string;
    avatar?: string;
  };
}

export async function protect(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
    return;
  }

  const decoded: JwtPayload | null = verifyToken(token);
  if (!decoded) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
    });
    return;
  }

  try {
    if (isConnectedToMongo) {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
        return;
      }
      req.user = {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      };
    } else {
      const user = localStore.users.find((u) => u._id.toString() === decoded.id.toString());
      if (!user) {
        res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
        return;
      }
      req.user = {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      };
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authentication verification failed.' });
  }
}

// Optional auth for routes that show extra personalization if logged in (e.g. isLiked)
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
      };
    }
  }
  next();
}
