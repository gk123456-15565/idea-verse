import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Globe,
  Calendar,
  UserPlus,
  UserCheck,
  Edit3,
  Lightbulb,
  Heart,
  Share2,
  Check,
} from 'lucide-react';
import { User, IdeaPost } from '../types';
import { usersApi, postsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import IdeaCard from '../components/IdeaCard';

interface ProfilePageProps {
  username: string;
  onEditProfileClick: () => void;
  onViewIdea: (post: IdeaPost) => void;
  onEditIdea: (post: IdeaPost) => void;
  onDeleteIdea: (postId: string) => void;
  onRequireAuth: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  username,
  onEditProfileClick,
  onViewIdea,
  onEditIdea,
  onDeleteIdea,
  onRequireAuth,
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<IdeaPost[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isOwnProfile = currentUser && currentUser.username.toLowerCase() === username.toLowerCase();

  const fetchProfileData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch user profile
      const userRes = await usersApi.getProfile(username);
      if (userRes.success && userRes.user) {
        setProfileUser(userRes.user);
        setIsFollowing(Boolean(userRes.user.isFollowing));
        setFollowersCount(userRes.user.followersCount || 0);

        // Fetch their published ideas
        const postsRes = await postsApi.getUserPosts(username);
        if (postsRes.success) {
          setUserPosts(postsRes.posts);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (!profileUser) return;

    try {
      if (isFollowing) {
        const res = await usersApi.unfollowUser(profileUser._id);
        if (res.success) {
          setIsFollowing(false);
          setFollowersCount(res.followersCount);
        }
      } else {
        const res = await usersApi.followUser(profileUser._id);
        if (res.success) {
          setIsFollowing(true);
          setFollowersCount(res.followersCount);
        }
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse space-y-6">
        <div className="h-40 bg-slate-200 rounded-3xl" />
        <div className="w-28 h-28 bg-slate-300 rounded-full -mt-14 ml-8 border-4 border-white" />
        <div className="w-48 h-6 bg-slate-200 rounded ml-8" />
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-3xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Creator Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">{error || 'This user profile does not exist.'}</p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Decorative subtle backdrop banner */}
        <div className="h-36 sm:h-44 bg-linear-to-r from-blue-500/10 via-sky-400/10 to-indigo-500/10 relative p-4 flex justify-end items-start">
          <button
            onClick={handleShareProfile}
            className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Profile</span>
              </>
            )}
          </button>
        </div>

        {/* Profile Info Header */}
        <div className="px-6 sm:px-8 pb-8 -mt-14 sm:-mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
            {/* Avatar */}
            <div className="relative inline-block">
              <img
                src={
                  profileUser.avatar ||
                  `https://api.dicebear.com/7.x/shapes/svg?seed=${profileUser.username}`
                }
                alt={profileUser.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover bg-white p-1 border-4 border-white shadow-md"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              {isOwnProfile ? (
                <button
                  id="profile-edit-btn"
                  onClick={onEditProfileClick}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  id="profile-follow-btn"
                  onClick={handleFollowToggle}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isFollowing
                      ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Name & Bio */}
          <div className="space-y-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {profileUser.name}
              </h1>
              <p className="text-xs text-slate-400 font-medium">@{profileUser.username}</p>
            </div>

            {profileUser.bio && (
              <p className="text-sm text-slate-700 max-w-2xl leading-relaxed whitespace-pre-line">
                {profileUser.bio}
              </p>
            )}

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500 font-medium">
              {profileUser.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profileUser.location}</span>
                </div>
              )}
              {profileUser.website && (
                <div className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <a
                    href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {profileUser.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {profileUser.createdAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Joined{' '}
                    {new Date(profileUser.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Followers / Following Stats */}
            <div className="flex items-center gap-6 pt-3">
              <div className="text-xs">
                <span className="font-extrabold text-slate-900 text-sm">{followersCount}</span>{' '}
                <span className="text-slate-500">Followers</span>
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-slate-900 text-sm">
                  {profileUser.followingCount || 0}
                </span>{' '}
                <span className="text-slate-500">Following</span>
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-slate-900 text-sm">{userPosts.length}</span>{' '}
                <span className="text-slate-500">Ideas Published</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 px-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 relative ${
            activeTab === 'posts'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Ideas ({userPosts.length})</span>
        </button>
      </div>

      {/* Ideas Grid */}
      {userPosts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-6">
          <Lightbulb className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 mb-1">No ideas published yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {isOwnProfile
              ? "You haven't shared an idea yet. Inspire the community with your first concept!"
              : `@${profileUser.username} has not published any ideas yet.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userPosts.map((post) => (
            <IdeaCard
              key={post._id}
              post={post}
              onView={onViewIdea}
              onEdit={onEditIdea}
              onDelete={onDeleteIdea}
              onCreatorClick={() => {}}
              onRequireAuth={onRequireAuth}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
