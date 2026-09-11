import React, { useState } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  MoreVertical,
  Edit3,
  Trash2,
  Check,
} from 'lucide-react';
import { IdeaPost } from '../types';
import { useAuth } from '../context/AuthContext';
import { likesApi } from '../services/api';

interface IdeaCardProps {
  post: IdeaPost;
  onView: (post: IdeaPost) => void;
  onEdit?: (post: IdeaPost) => void;
  onDelete?: (postId: string) => void;
  onCreatorClick?: (username: string) => void;
  onRequireAuth?: () => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({
  post,
  onView,
  onEdit,
  onDelete,
  onCreatorClick,
  onRequireAuth,
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const currentUserId = currentUser?._id;

  // Determine initial like status
  const authorObj = typeof post.author === 'object' ? post.author : { _id: post.author, name: 'Creator', username: 'creator' };
  const isOwner = currentUserId && authorObj._id?.toString() === currentUserId.toString();

  const [isLiked, setIsLiked] = useState<boolean>(
    Boolean(currentUserId && post.likes?.includes(currentUserId))
  );
  const [likesCount, setLikesCount] = useState<number>(post.likesCount || (post.likes ? post.likes.length : 0));
  const [isLiking, setIsLiking] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    // Optimistic toggle
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await likesApi.toggleLike(post._id);
      if (res.success) {
        setIsLiked(res.liked);
        setLikesCount(res.likesCount);
      } else {
        // Rollback
        setIsLiked(prevLiked);
        setLikesCount(prevCount);
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/#idea-${post._id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <article
      id={`idea-card-${post._id}`}
      onClick={() => onView(post)}
      className="group bg-white rounded-2xl border border-slate-200/70 hover:border-slate-300/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
    >
      <div>
        {/* Card Header: Author info & Category */}
        <div className="p-4 sm:p-5 pb-3 flex items-center justify-between gap-3">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onCreatorClick?.(authorObj.username);
            }}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <img
              src={
                authorObj.avatar ||
                `https://api.dicebear.com/7.x/shapes/svg?seed=${authorObj.username}`
              }
              alt={authorObj.name}
              className="w-9 h-9 rounded-full object-cover bg-slate-100 border border-slate-200"
            />
            <div>
              <p className="text-xs font-bold text-slate-900 line-clamp-1 leading-tight">
                {authorObj.name}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>@{authorObj.username}</span>
                <span>•</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              {post.category}
            </span>

            {isOwner && (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  id={`post-menu-btn-${post._id}`}
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showOptions && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowOptions(false)}
                    />
                    <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-40">
                      <button
                        onClick={() => {
                          setShowOptions(false);
                          onEdit?.(post);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        Edit Idea
                      </button>
                      <button
                        onClick={() => {
                          setShowOptions(false);
                          onDelete?.(post._id);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content: Title & Description */}
        <div className="px-4 sm:px-5 pb-3">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
            {post.title}
          </h3>
          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
            {post.description}
          </p>
        </div>

        {/* Image Display if present */}
        {post.image && (
          <div className="relative w-full aspect-16/9 bg-slate-100 overflow-hidden">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        {/* Tags if present */}
        {post.tags && post.tags.length > 0 && (
          <div className="px-4 sm:px-5 pt-3 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-[11px] font-medium text-slate-400 self-center">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Interaction stats */}
      <div className="px-4 sm:px-5 py-3 mt-2 border-t border-slate-100/80 flex items-center justify-between text-slate-500 text-xs font-medium">
        <div className="flex items-center gap-4">
          <button
            id={`like-btn-${post._id}`}
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer active:scale-90 ${
              isLiked ? 'text-rose-500 font-semibold' : 'hover:text-rose-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{likesCount}</span>
          </button>

          <button
            id={`comment-btn-${post._id}`}
            onClick={(e) => {
              e.stopPropagation();
              onView(post);
            }}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.commentsCount || 0}</span>
          </button>
        </div>

        <button
          id={`share-btn-${post._id}`}
          onClick={handleShare}
          className="flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer"
          title="Copy link"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};

export default IdeaCard;
