import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  X,
  Compass,
  SlidersHorizontal,
  Flame,
  Clock,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { IdeaPost } from '../types';
import { postsApi } from '../services/api';
import IdeaCard from '../components/IdeaCard';
import { CATEGORY_ITEMS } from '../components/CategoryBar';

interface ExplorePageProps {
  initialSearch?: string;
  initialCategory?: string;
  onViewIdea: (post: IdeaPost) => void;
  onEditIdea: (post: IdeaPost) => void;
  onDeleteIdea: (postId: string) => void;
  onCreatorClick: (username: string) => void;
  onRequireAuth: () => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  initialSearch = '',
  initialCategory = 'All',
  onViewIdea,
  onEditIdea,
  onDeleteIdea,
  onCreatorClick,
  onRequireAuth,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortOption, setSortOption] = useState<'latest' | 'popular' | 'trending'>('latest');

  const [posts, setPosts] = useState<IdeaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await postsApi.getPosts({
        search: searchTerm.trim() || undefined,
        category: selectedCategory,
        sort: sortOption,
      });
      if (res.success) {
        setPosts(res.posts);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory, sortOption]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSortOption('latest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4" />
          <span>Discovery Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Explore Ideas & Innovations
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Uncover original projects, scientific breakthroughs, and designs across disciplines.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              id="explore-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by keywords, tags, title, or concepts..."
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown (for quick select) */}
          <div className="flex items-center gap-2">
            <select
              id="explore-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:border-blue-500 outline-hidden cursor-pointer"
            >
              {CATEGORY_ITEMS.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              id="explore-sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:border-blue-500 outline-hidden cursor-pointer"
            >
              <option value="latest">Latest First</option>
              <option value="popular">Most Liked</option>
              <option value="trending">Most Discussed</option>
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="pt-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_ITEMS.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Active Filter Badges */}
        {(searchTerm || selectedCategory !== 'All' || sortOption !== 'latest') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700">Active filters:</span>
              {searchTerm && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
                  Query: "{searchTerm}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                </span>
              )}
              {selectedCategory !== 'All' && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
                  Category: {selectedCategory}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('All')} />
                </span>
              )}
            </div>

            <button
              onClick={handleClearFilters}
              className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {isLoading ? 'Searching...' : `Found ${posts.length} ideas`}
        </p>

        <button
          onClick={fetchResults}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Grid of Ideas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200/60 p-5 animate-pulse space-y-3"
            >
              <div className="w-20 h-4 bg-slate-200 rounded" />
              <div className="w-3/4 h-5 bg-slate-200 rounded" />
              <div className="w-full h-14 bg-slate-100 rounded" />
              <div className="w-full aspect-16/9 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No matching ideas found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Try adjusting your search keywords or switching category filters.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <IdeaCard
              key={post._id}
              post={post}
              onView={onViewIdea}
              onEdit={onEditIdea}
              onDelete={onDeleteIdea}
              onCreatorClick={onCreatorClick}
              onRequireAuth={onRequireAuth}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
