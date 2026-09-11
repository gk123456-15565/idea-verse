import React, { useState } from 'react';
import {
  Lightbulb,
  Compass,
  PlusCircle,
  Bell,
  User as UserIcon,
  LogOut,
  Settings,
  Menu,
  X,
  Database,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenAuth,
}) => {
  const { currentUser, isAuthenticated, logout, unreadNotificationsCount, authStatus } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      onNavigate('explore', { search: quickSearch.trim() });
      setQuickSearch('');
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="brand-home-btn"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/30 group-hover:bg-blue-700 transition-all">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-tight">
                  IDEAVERSE
                </span>
                <span className="hidden lg:block text-[11px] font-medium text-slate-500 tracking-normal">
                  Share Ideas. Inspire Minds.
                </span>
              </div>
            </button>
          </div>

          {/* Quick Search bar (Desktop & Tablet) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md items-center relative"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              id="header-search-input"
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search concepts, technologies, creators..."
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-hidden"
            />
          </form>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              id="nav-home-btn"
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentPage === 'home'
                  ? 'text-blue-600 bg-blue-50/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Feed
            </button>

            <button
              id="nav-explore-btn"
              onClick={() => onNavigate('explore')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentPage === 'explore'
                  ? 'text-blue-600 bg-blue-50/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              Explore
            </button>

            {isAuthenticated && (
              <button
                id="nav-notifications-btn"
                onClick={() => onNavigate('notifications')}
                className={`relative px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentPage === 'notifications'
                    ? 'text-blue-600 bg-blue-50/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span>Alerts</span>
                {unreadNotificationsCount > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-blue-600 rounded-full">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Share Idea CTA Button */}
            <button
              id="nav-share-idea-btn"
              onClick={() => {
                if (!isAuthenticated) {
                  onOpenAuth('login');
                } else {
                  onNavigate('share');
                }
              }}
              className="ml-1 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Share Idea</span>
            </button>
          </nav>

          {/* Right Action / Profile Menu */}
          <div className="flex items-center gap-2">
            {/* Database indicator pill */}
            <div
              title={authStatus.dbConnected ? 'Connected to MongoDB Atlas' : 'Running on resilient local data store'}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 border border-slate-200/60"
            >
              <Database className={`w-3.5 h-3.5 ${authStatus.dbConnected ? 'text-emerald-500' : 'text-blue-500'}`} />
              <span className="truncate max-w-[120px]">
                {authStatus.dbConnected ? 'MongoDB Atlas' : 'Local DB'}
              </span>
            </div>

            {isAuthenticated && currentUser ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <img
                    src={currentUser.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${currentUser.username}`}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover bg-blue-50 border border-slate-200"
                  />
                  <span className="text-xs font-semibold text-slate-800 max-w-[90px] truncate hidden sm:inline">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-xs text-slate-500 truncate">@{currentUser.username}</p>
                      </div>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('profile', { username: currentUser.username });
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        My Profile
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('settings');
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Settings
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="header-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Log In
                </button>
                <button
                  id="header-signup-btn"
                  onClick={() => onOpenAuth('signup')}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 flex flex-col gap-2">
            <form onSubmit={handleSearchSubmit} className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Search ideas..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 text-slate-800 rounded-xl border border-transparent focus:border-blue-500 outline-hidden"
              />
            </form>

            <button
              onClick={() => {
                onNavigate('home');
                setIsMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-xl text-sm font-semibold text-left flex items-center gap-2 ${
                currentPage === 'home' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
              }`}
            >
              Feed
            </button>

            <button
              onClick={() => {
                onNavigate('explore');
                setIsMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-xl text-sm font-semibold text-left flex items-center gap-2 ${
                currentPage === 'explore' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
              }`}
            >
              <Compass className="w-4 h-4" />
              Explore Ideas
            </button>

            {isAuthenticated && (
              <button
                onClick={() => {
                  onNavigate('notifications');
                  setIsMobileMenuOpen(false);
                }}
                className={`px-3 py-2 rounded-xl text-sm font-semibold text-left flex items-center justify-between ${
                  currentPage === 'notifications' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </div>
                {unreadNotificationsCount > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-blue-600 rounded-full">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  onOpenAuth('login');
                } else {
                  onNavigate('share');
                }
                setIsMobileMenuOpen(false);
              }}
              className="mt-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Share an Idea
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
