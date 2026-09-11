export interface User {
  _id: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  followers?: string[];
  following?: string[];
  followersCount: number;
  followingCount: number;
  notificationsEnabled?: boolean;
  createdAt?: string;
  isFollowing?: boolean;
}

export type IdeaCategory =
  | 'Technology'
  | 'Science'
  | 'Education'
  | 'Art'
  | 'Business'
  | 'Gaming'
  | 'Environment'
  | 'Creativity'
  | 'Innovation'
  | 'Other';

export interface IdeaPost {
  _id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  image?: string;
  author: User;
  tags: string[];
  likes: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
}

export interface IdeaComment {
  _id: string;
  post: string;
  author: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  text: string;
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  type: 'like' | 'comment' | 'follow' | 'system';
  post?: {
    _id: string;
    title: string;
  };
  text: string;
  isRead?: boolean;
  read?: boolean;
  createdAt: string;
}

export type NotificationItem = AppNotification;

export interface AuthStatus {
  dbConnected: boolean;
  googleAuthAvailable: boolean;
  googleClientId: string | null;
}
