import React, { useState, useEffect, useCallback } from 'react';
import {
  Lightbulb,
  PlusCircle,
  TrendingUp,
  Clock,
  Flame,
  Search,
  Sparkles,
  Database,
  ArrowRight,
  UserPlus,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { IdeaPost, User } from '../types';
import { postsApi, usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CategoryBar from '../components/CategoryBar';
import IdeaCard from '../components/IdeaCard';

interface HomePageProps {
  onNavigate: (page: string, params?: any) => void;
  onViewIdea: (post: IdeaPost) => void;
  onEditIdea: (post: IdeaPost) => void;
  onDeleteIdea: (postId: string) => void;
  onRequireAuth: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onViewIdea,
  onEditIdea,
  onDeleteIdea,
  onRequireAuth,
}) => {
  const { currentUser, isAuthenticated, authStatus } = useAuth();

  const [posts, setPosts] = useState<IdeaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeSort, setActiveSort] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [topCreators, setTopCreators] = useState<User[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const fetchFeedPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await postsApi.getPosts({
        category: selectedCategory,
        sort: activeSort,
      });
      if (res.success) {
        setPosts(res.posts);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, activeSort]);

  // Load top creators for sidebar
  const fetchCreators = useCallback(async () => {
    try {
      const res = await usersApi.searchUsers('a');
      if (res.success && res.users) {
        // Exclude self
        const filtered = res.users.filter((u) => u._id !== currentUser?._id).slice(0, 4);
        setTopCreators(filtered);
      }
    } catch {
      // ignore
    }
  }, [currentUser?._id]);

  useEffect(() => {
    fetchFeedPosts();
  }, [fetchFeedPosts]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const handleFollowCreator = async (creatorId: string) => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    const currentlyFollowing = !!followingMap[creatorId];
    setFollowingMap((prev) => ({ ...prev, [creatorId]: !currentlyFollowing }));

    try {
      if (currentlyFollowing) {
        await usersApi.unfollowUser(creatorId);
      } else {
        await usersApi.followUser(creatorId);
      }
    } catch {
      // rollback
      setFollowingMap((prev) => ({ ...prev, [creatorId]: currentlyFollowing }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero / Platform Statement Banner */}
      <section className="mb-8 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 mb-3.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>The Intellectual Social Medium</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2.5">
            Share Ideas. Inspire Minds. <span className="text-blue-600">Build Together.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
            IDEAVERSE is a clean, intentional platform dedicated to profound concepts, innovations, and visual blueprints — built for thoughtful dialogue through text and images, free from short-form reel distraction.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="hero-share-idea-btn"
              onClick={() => {
                if (!isAuthenticated) onRequireAuth();
                else onNavigate('share');
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Share an Idea</span>
            </button>

            <button
              id="hero-explore-btn"
              onClick={() => onNavigate('explore')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Explore Discoveries</span>
            </button>
          </div>
        </div>

        {/* Ambient subtle decorative element */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-50/70 rounded-full blur-2xl pointer-events-none -z-0" />
      </section>

      {/* Main Layout: Feed + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left / Center: Idea Feed */}
        <div className="lg:col-span-8 space-y-5">
          {/* Quick Create Prompt (if authenticated) */}
          {isAuthenticated && (
            <div
              onClick={() => onNavigate('share')}
              className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center gap-3"
            >
              <img
                src={
                  currentUser?.avatar ||
                  `https://api.dicebear.com/7.x/shapes/svg?seed=${currentUser?.username}`
                }
                alt={currentUser?.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-200"
              />
              <div className="flex-1 px-4 py-2 bg-slate-50 rounded-xl text-xs sm:text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-colors">
                What breakthrough concept are you thinking about, {currentUser?.name.split(' ')[0]}?
              </div>
              <button className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </div>
          )}

          {/* Category Chips Filter */}
          <div className="bg-white rounded-2xl p-2.5 border border-slate-200/70 shadow-2xs">
            <CategoryBar
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
            />
          </div>

          {/* Feed Filter / Sort Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl">
              <button
                id="sort-latest-btn"
                onClick={() => setActiveSort('latest')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSort === 'latest'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Latest</span>
              </button>

              <button
                id="sort-popular-btn"
                onClick={() => setActiveSort('popular')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSort === 'popular'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Popular</span>
              </button>

              <button
                id="sort-trending-btn"
                onClick={() => setActiveSort('trending')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSort === 'trending'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Trending</span>
              </button>
            </div>

            <button
              onClick={fetchFeedPosts}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Refresh feed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>

          {/* Posts Feed */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl border border-slate-200/60 p-6 animate-pulse space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <div className="w-24 h-3 bg-slate-200 rounded" />
                      <div className="w-16 h-2 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="w-3/4 h-5 bg-slate-200 rounded" />
                  <div className="w-full h-16 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-white rounded-2xl border border-rose-200 text-rose-600 text-xs">
              <p className="font-semibold mb-2">Could not load ideas.</p>
              <p className="text-slate-500 mb-3">{error}</p>
              <button
                onClick={fetchFeedPosts}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Lightbulb className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                No ideas in {selectedCategory} yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
                Be the pioneer who publishes the very first concept in this domain!
              </p>
              <button
                onClick={() => {
                  if (!isAuthenticated) onRequireAuth();
                  else onNavigate('share');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Share This Idea
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <IdeaCard
                  key={post._id}
                  post={post}
                  onView={onViewIdea}
                  onEdit={onEditIdea}
                  onDelete={onDeleteIdea}
                  onCreatorClick={(username) => onNavigate('profile', { username })}
                  onRequireAuth={onRequireAuth}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Discovery & Context */}
        <div className="lg:col-span-4 space-y-6">
          {/* Philosophy / Community Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
              Why IDEAVERSE?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Unlike ephemeral video reels, great ideas need space to breathe. Here, thinkers, engineers, scientists, and creatives share clear conceptual text and detailed diagrams.
            </p>

            <div className="space-y-2.5 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Text and imagery focused</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Constructive feedback threads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Direct collaboration on projects</span>
              </div>
            </div>
          </div>

          {/* Creators to Follow */}
          {topCreators.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Featured Creators
                </h3>
                <button
                  onClick={() => onNavigate('explore')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3.5">
                {topCreators.map((creator) => {
                  const isFollowing = !!followingMap[creator._id];

                  return (
                    <div
                      key={creator._id}
                      className="flex items-center justify-between gap-3"
                    >
                      <button
                        onClick={() => onNavigate('profile', { username: creator.username })}
                        className="flex items-center gap-2.5 text-left group cursor-pointer min-w-0"
                      >
                        <img
                          src={
                            creator.avatar ||
                            `https://api.dicebear.com/7.x/shapes/svg?seed=${creator.username}`
                          }
                          alt={creator.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                            {creator.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">@{creator.username}</p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleFollowCreator(creator._id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                          isFollowing
                            ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {isFollowing ? (
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            <span>Following</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <UserPlus className="w-3 h-3" />
                            <span>Follow</span>
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Infrastructure & Status Box */}
          <div className="bg-slate-50/80 rounded-3xl p-4 border border-slate-200/60 text-xs text-slate-500 space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-500" />
                Database Engine
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                authStatus.dbConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {authStatus.dbConnected ? 'MongoDB Atlas' : 'Local Active'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              {authStatus.dbConnected
                ? 'Persisting live data directly into MongoDB Atlas cluster.'
                : 'Running on local data store. Provide MONGODB_URI in .env for Atlas sync.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
