import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { ShareIdeaPage } from './pages/ShareIdeaPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthModal } from './components/AuthModal';
import { IdeaDetailModal } from './components/IdeaDetailModal';
import { EditProfileModal } from './components/EditProfileModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { IdeaPost } from './types';
import { postsApi } from './services/api';
import { Lightbulb, Heart, Shield, Sparkles } from 'lucide-react';

function MainApp() {
  const { currentUser, isAuthenticated } = useAuth();

  // Navigation state
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParams, setPageParams] = useState<any>({});

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const [activeIdeaPost, setActiveIdeaPost] = useState<IdeaPost | null>(null);
  const [editingPost, setEditingPost] = useState<IdeaPost | null>(null);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Delete modal state
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // Deep linking check on hashchange or initial load
  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#idea-')) {
        const postId = hash.replace('#idea-', '');
        if (postId) {
          try {
            const res = await postsApi.getPostById(postId);
            if (res.success && res.post) {
              setActiveIdeaPost(res.post);
            }
          } catch {
            // ignore
          }
        }
      } else if (hash.startsWith('#profile-')) {
        const username = hash.replace('#profile-', '');
        if (username) {
          setCurrentPage('profile');
          setPageParams({ username });
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page);
    setPageParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (page === 'profile' && params?.username) {
      window.location.hash = `profile-${params.username}`;
    } else if (page === 'home') {
      if (window.location.hash.startsWith('#profile-') || window.location.hash.startsWith('#idea-')) {
        window.history.pushState('', document.title, window.location.pathname);
      }
    }
  };

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleViewIdea = (post: IdeaPost) => {
    setActiveIdeaPost(post);
    window.location.hash = `idea-${post._id}`;
  };

  const handleCloseIdeaModal = () => {
    setActiveIdeaPost(null);
    if (window.location.hash.startsWith('#idea-')) {
      window.history.pushState('', document.title, window.location.pathname);
    }
  };

  const handleStartEditIdea = (post: IdeaPost) => {
    setEditingPost(post);
    setCurrentPage('share');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePostPrompt = (postId: string) => {
    setPostToDelete(postId);
  };

  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      setIsDeletingPost(true);
      const res = await postsApi.deletePost(postToDelete);
      if (res.success) {
        setPostToDelete(null);
        if (activeIdeaPost && activeIdeaPost._id === postToDelete) {
          handleCloseIdeaModal();
        }
        // Refresh by re-navigating to current page
        setCurrentPage((prev) => prev);
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleViewIdeaById = async (postId: string) => {
    try {
      const res = await postsApi.getPostById(postId);
      if (res.success && res.post) {
        setActiveIdeaPost(res.post);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onViewIdea={handleViewIdea}
            onEditIdea={handleStartEditIdea}
            onDeleteIdea={handleDeletePostPrompt}
            onRequireAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentPage === 'explore' && (
          <ExplorePage
            initialSearch={pageParams.search || ''}
            initialCategory={pageParams.category || 'All'}
            onViewIdea={handleViewIdea}
            onEditIdea={handleStartEditIdea}
            onDeleteIdea={handleDeletePostPrompt}
            onCreatorClick={(username) => handleNavigate('profile', { username })}
            onRequireAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentPage === 'share' && (
          <ShareIdeaPage
            editingPost={editingPost}
            onPostCreated={(post) => {
              setEditingPost(null);
              handleNavigate('home');
              handleViewIdea(post);
            }}
            onCancel={() => {
              setEditingPost(null);
              handleNavigate('home');
            }}
          />
        )}

        {currentPage === 'profile' && (
          <ProfilePage
            username={pageParams.username || currentUser?.username || 'elena_vance'}
            onEditProfileClick={() => setIsEditProfileOpen(true)}
            onViewIdea={handleViewIdea}
            onEditIdea={handleStartEditIdea}
            onDeleteIdea={handleDeletePostPrompt}
            onRequireAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentPage === 'notifications' && (
          <NotificationsPage
            onNavigate={handleNavigate}
            onViewIdeaById={handleViewIdeaById}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage onNavigate={handleNavigate} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-10 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-sm">
              IDEAVERSE
            </span>
            <span className="text-slate-400">|</span>
            <span>Share Ideas. Inspire Minds. Build Together.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => handleNavigate('explore')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Categories
            </button>
            <button
              onClick={() => handleNavigate('explore', { search: '' })}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Discoveries
            </button>
            <button
              onClick={() => handleNavigate('settings')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Diagnostics
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {activeIdeaPost && (
        <IdeaDetailModal
          post={activeIdeaPost}
          onClose={handleCloseIdeaModal}
          onEdit={(post) => {
            handleCloseIdeaModal();
            handleStartEditIdea(post);
          }}
          onDelete={(postId) => {
            handleDeletePostPrompt(postId);
          }}
          onCreatorClick={(username) => {
            handleCloseIdeaModal();
            handleNavigate('profile', { username });
          }}
          onRequireAuth={() => handleOpenAuth('login')}
          onPostUpdated={(updated) => setActiveIdeaPost(updated)}
        />
      )}

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onProfileUpdated={() => {
          if (currentPage === 'profile') {
            setCurrentPage('profile');
          }
        }}
      />

      <DeleteConfirmModal
        isOpen={Boolean(postToDelete)}
        title="Delete this Idea?"
        message="This action cannot be undone. Your idea, images, comments, and community engagements will be permanently removed."
        isDeleting={isDeletingPost}
        onConfirm={handleConfirmDeletePost}
        onCancel={() => setPostToDelete(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
