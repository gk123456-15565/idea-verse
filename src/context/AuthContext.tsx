import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthStatus } from '../types';
import { authApi, getStoredToken, setStoredToken, removeStoredToken, notificationsApi } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authStatus: AuthStatus;
  unreadNotificationsCount: number;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshMe: () => Promise<void>;
  refreshNotificationsCount: () => Promise<void>;
}

const defaultAuthStatus: AuthStatus = {
  dbConnected: false,
  googleAuthAvailable: false,
  googleClientId: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(defaultAuthStatus);

  // Fetch server status (DB & Google Auth availability)
  const fetchAuthStatus = useCallback(async () => {
    try {
      const status = await authApi.getStatus();
      setAuthStatus(status);
    } catch {
      // Non-critical fallback
    }
  }, []);

  const refreshNotificationsCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await notificationsApi.getNotifications();
      if (res.success) {
        setUnreadNotificationsCount(res.unreadCount);
      }
    } catch {
      // ignore
    }
  }, [token]);

  const refreshMe = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setToken(currentToken);
      } else {
        removeStoredToken();
        setCurrentUser(null);
        setToken(null);
      }
    } catch {
      removeStoredToken();
      setCurrentUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthStatus();
    refreshMe();
  }, [fetchAuthStatus, refreshMe]);

  useEffect(() => {
    if (currentUser) {
      refreshNotificationsCount();
      const interval = setInterval(refreshNotificationsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, refreshNotificationsCount]);

  const login = async (emailOrUsername: string, password: string) => {
    const res = await authApi.login(emailOrUsername, password);
    if (res.token && res.user) {
      setStoredToken(res.token);
      setToken(res.token);
      setCurrentUser(res.user);
      refreshNotificationsCount();
    }
  };

  const register = async (name: string, username: string, email: string, password: string) => {
    const res = await authApi.register(name, username, email, password);
    if (res.token && res.user) {
      setStoredToken(res.token);
      setToken(res.token);
      setCurrentUser(res.user);
      refreshNotificationsCount();
    }
  };

  const googleLogin = async (credential: string) => {
    const res = await authApi.googleLogin(credential);
    if (res.token && res.user) {
      setStoredToken(res.token);
      setToken(res.token);
      setCurrentUser(res.user);
      refreshNotificationsCount();
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      removeStoredToken();
      setToken(null);
      setCurrentUser(null);
      setUnreadNotificationsCount(0);
    }
  };

  const updateUser = (user: User) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...user } : user));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: !!currentUser,
        isLoading,
        authStatus,
        unreadNotificationsCount,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
        refreshMe,
        refreshNotificationsCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
