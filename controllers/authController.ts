import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User';
import { isConnectedToMongo } from '../config/db';
import { localStore, DataUser } from '../utils/dataStore';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
let googleClient: OAuth2Client | null = null;
if (googleClientId && googleClientId !== 'your_google_client_id') {
  googleClient = new OAuth2Client(googleClientId);
}

export async function getAuthStatus(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    dbConnected: isConnectedToMongo,
    googleAuthAvailable: !!(googleClientId && googleClientId !== 'your_google_client_id'),
    googleClientId: (googleClientId && googleClientId !== 'your_google_client_id') ? googleClientId : null,
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide all required fields: name, username, email, and password.' });
      return;
    }

    if (username.length < 3 || username.length > 30) {
      res.status(400).json({ success: false, message: 'Username must be between 3 and 30 characters.' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      res.status(400).json({ success: false, message: 'Username can only contain alphanumeric characters and underscores.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (isConnectedToMongo) {
      const existingUser = await User.findOne({
        $or: [{ email: cleanEmail }, { username: cleanUsername }],
      });

      if (existingUser) {
        if (existingUser.email === cleanEmail) {
          res.status(400).json({ success: false, message: 'An account with this email already exists.' });
          return;
        }
        res.status(400).json({ success: false, message: 'This username is already taken. Please choose another.' });
        return;
      }

      const user = await User.create({
        name: name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${cleanUsername}`,
      });

      const token = generateToken({
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          followersCount: user.followers.length,
          followingCount: user.following.length,
        },
      });
    } else {
      // Local fallback
      const existing = localStore.users.find(
        (u) => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername
      );
      if (existing) {
        if (existing.email.toLowerCase() === cleanEmail) {
          res.status(400).json({ success: false, message: 'An account with this email already exists.' });
          return;
        }
        res.status(400).json({ success: false, message: 'This username is already taken.' });
        return;
      }

      const newId = 'usr_' + Date.now() + Math.random().toString(36).substring(2, 7);
      const newUser: DataUser = {
        _id: newId,
        name: name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${cleanUsername}`,
        bio: '',
        website: '',
        location: '',
        followers: [],
        following: [],
        notificationsEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStore.users.push(newUser);

      const token = generateToken({
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        token,
        user: {
          _id: newUser._id,
          name: newUser.name,
          username: newUser.username,
          email: newUser.email,
          avatar: newUser.avatar,
          bio: newUser.bio,
          followersCount: 0,
          followingCount: 0,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      res.status(400).json({ success: false, message: 'Please provide both email/username and password.' });
      return;
    }

    const identifier = emailOrUsername.trim().toLowerCase();

    if (isConnectedToMongo) {
      const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });

      if (!user || !user.password) {
        res.status(401).json({ success: false, message: 'Invalid credentials. Please check your username/email and password.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
        return;
      }

      const token = generateToken({
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      });

      res.json({
        success: true,
        message: 'Logged in successfully!',
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          location: user.location,
          followersCount: user.followers.length,
          followingCount: user.following.length,
        },
      });
    } else {
      const user = localStore.users.find(
        (u) => u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier
      );

      if (!user || !user.password) {
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
        return;
      }

      const token = generateToken({
        id: user._id,
        username: user.username,
        email: user.email,
      });

      res.json({
        success: true,
        message: 'Logged in successfully!',
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          location: user.location,
          followersCount: user.followers.length,
          followingCount: user.following.length,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function googleAuth(req: Request, res: Response): Promise<void> {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({ success: false, message: 'Missing Google credential token.' });
      return;
    }

    if (!googleClientId || googleClientId === 'your_google_client_id') {
      res.status(400).json({
        success: false,
        message: 'Google Sign-In is not configured yet on this server. Please set GOOGLE_CLIENT_ID in .env or sign in with your email and password.',
      });
      return;
    }

    if (!googleClient) {
      googleClient = new OAuth2Client(googleClientId);
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ success: false, message: 'Could not verify Google account details.' });
      return;
    }

    const { email, name, picture, sub: googleId } = payload;
    const cleanEmail = email.toLowerCase();
    const baseUsername = (name || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().substring(0, 20) || 'creator';

    if (isConnectedToMongo) {
      let user = await User.findOne({
        $or: [{ email: cleanEmail }, { googleId }],
      });

      if (!user) {
        // Ensure unique username
        let uniqueUsername = baseUsername;
        let counter = 1;
        while (await User.findOne({ username: uniqueUsername })) {
          uniqueUsername = `${baseUsername}${counter++}`;
        }

        user = await User.create({
          name: name || 'Google User',
          username: uniqueUsername,
          email: cleanEmail,
          googleId,
          avatar: picture || `https://api.dicebear.com/7.x/shapes/svg?seed=${uniqueUsername}`,
        });
      } else if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatar && picture) user.avatar = picture;
        await user.save();
      }

      const token = generateToken({
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      });

      res.json({
        success: true,
        message: 'Google authentication successful!',
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          followersCount: user.followers.length,
          followingCount: user.following.length,
        },
      });
    } else {
      let user = localStore.users.find((u) => u.email.toLowerCase() === cleanEmail || u.googleId === googleId);
      if (!user) {
        let uniqueUsername = baseUsername;
        let counter = 1;
        while (localStore.users.find((u) => u.username === uniqueUsername)) {
          uniqueUsername = `${baseUsername}${counter++}`;
        }

        user = {
          _id: 'usr_g_' + Date.now(),
          name: name || 'Google User',
          username: uniqueUsername,
          email: cleanEmail,
          googleId,
          avatar: picture || `https://api.dicebear.com/7.x/shapes/svg?seed=${uniqueUsername}`,
          bio: '',
          website: '',
          location: '',
          followers: [],
          following: [],
          notificationsEnabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStore.users.push(user);
      }

      const token = generateToken({
        id: user._id,
        username: user.username,
        email: user.email,
      });

      res.json({
        success: true,
        message: 'Google authentication successful!',
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          followersCount: user.followers.length,
          followingCount: user.following.length,
        },
      });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: `Google authentication failed: ${(error as Error).message}` });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (isConnectedToMongo) {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          location: user.location,
          followers: user.followers,
          following: user.following,
          followersCount: user.followers.length,
          followingCount: user.following.length,
          notificationsEnabled: user.notificationsEnabled,
          createdAt: user.createdAt,
        },
      });
    } else {
      const user = localStore.users.find((u) => u._id.toString() === req.user?.id.toString());
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          location: user.location,
          followers: user.followers,
          following: user.following,
          followersCount: user.followers.length,
          followingCount: user.following.length,
          notificationsEnabled: user.notificationsEnabled,
          createdAt: user.createdAt,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.json({ success: true, message: 'Logged out successfully' });
}
