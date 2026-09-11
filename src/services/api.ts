import { User, IdeaPost, IdeaComment, AppNotification, AuthStatus } from '../types';

const TOKEN_KEY = 'ideverse_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If body is not FormData, default to application/json
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(endpoint, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// Auth API
export const authApi = {
  getStatus: () => request<AuthStatus>('/api/auth/status'),
  login: (emailOrUsername: string, password: string) =>
    request<{ success: boolean; token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password }),
    }),
  register: (name: string, username: string, email: string, password: string) =>
    request<{ success: boolean; token: string; user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, username, email, password }),
    }),
  googleLogin: (credential: string) =>
    request<{ success: boolean; token: string; user: User; message: string }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),
  getMe: () => request<{ success: boolean; user: User }>('/api/auth/me'),
  logout: () =>
    request<{ success: boolean; message: string }>('/api/auth/logout', {
      method: 'POST',
    }),
};

// Posts API
export const postsApi = {
  getPosts: (params?: { category?: string; search?: string; author?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.author) query.set('author', params.author);
    if (params?.sort) query.set('sort', params.sort);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<{ success: boolean; count: number; posts: IdeaPost[] }>(`/api/posts${queryString}`);
  },
  getPostById: (id: string) => request<{ success: boolean; post: IdeaPost }>(`/api/posts/${id}`),
  createPost: (formData: FormData) =>
    request<{ success: boolean; message: string; post: IdeaPost }>('/api/posts', {
      method: 'POST',
      body: formData,
    }),
  updatePost: (id: string, formData: FormData) =>
    request<{ success: boolean; message: string; post: IdeaPost }>(`/api/posts/${id}`, {
      method: 'PUT',
      body: formData,
    }),
  deletePost: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/posts/${id}`, {
      method: 'DELETE',
    }),
  getUserPosts: (username: string) =>
    request<{ success: boolean; posts: IdeaPost[] }>(`/api/posts/user/${username}`),
};

// Comments API
export const commentsApi = {
  getComments: (postId: string) =>
    request<{ success: boolean; count: number; comments: IdeaComment[] }>(`/api/comments/post/${postId}`),
  addComment: (postId: string, text: string) =>
    request<{ success: boolean; message: string; comment: IdeaComment }>(`/api/comments/post/${postId}`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  deleteComment: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/comments/${id}`, {
      method: 'DELETE',
    }),
};

// Likes API
export const likesApi = {
  toggleLike: (postId: string) =>
    request<{ success: boolean; liked: boolean; likesCount: number; message: string }>(
      `/api/likes/post/${postId}`,
      {
        method: 'POST',
      }
    ),
  getLikes: (postId: string) =>
    request<{ success: boolean; count: number; isLikedByCurrentUser: boolean; likes: any[] }>(
      `/api/likes/post/${postId}`
    ),
};

// Users API
export const usersApi = {
  getProfile: (username: string) =>
    request<{ success: boolean; user: User }>(`/api/users/${username}`),
  updateProfile: (formData: FormData) =>
    request<{ success: boolean; message: string; user: User }>('/api/users/profile/update', {
      method: 'PUT',
      body: formData,
    }),
  followUser: (id: string) =>
    request<{ success: boolean; isFollowing: boolean; followersCount: number; message: string }>(
      `/api/users/${id}/follow`,
      {
        method: 'POST',
      }
    ),
  unfollowUser: (id: string) =>
    request<{ success: boolean; isFollowing: boolean; followersCount: number; message: string }>(
      `/api/users/${id}/unfollow`,
      {
        method: 'POST',
      }
    ),
  searchUsers: (query: string) =>
    request<{ success: boolean; users: User[] }>(`/api/users/search?q=${encodeURIComponent(query)}`),
};

// Notifications API
export const notificationsApi = {
  getNotifications: () =>
    request<{ success: boolean; unreadCount: number; notifications: AppNotification[] }>('/api/notifications'),
  markAsRead: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllAsRead: () =>
    request<{ success: boolean; message: string }>('/api/notifications/read-all', {
      method: 'PUT',
    }),
  deleteNotification: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/notifications/${id}`, {
      method: 'DELETE',
    }),
};
