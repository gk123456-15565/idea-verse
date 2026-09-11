import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  Edit3,
  Send,
  UserPlus,
  UserCheck,
  Check,
} from 'lucide-react';
import { IdeaPost, IdeaComment } from '../types';
import { useAuth } from '../context/AuthContext';
import { commentsApi, likesApi, usersApi } from '../services/api';

interface IdeaDetailModalProps {
  post: IdeaPost;
  onClose: () => void;
  onEdit?: (post: IdeaPost) => void;
  onDelete?: (postId: string) => void;
  onCreatorClick?: (username: string) => void;
  onRequireAuth?: () => void;
  onPostUpdated?: (updated: IdeaPost) => void;
}

export const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({
  post,
  onClose,
  onEdit,
  onDelete,
  onCreatorClick,
  onRequireAuth,
  onPostUpdated,
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const currentUserId = currentUser?._id;

  const author = typeof post.author === 'object' ? post.author : { _id: post.author, name: 'Creator', username: 'creator' };
  const isOwner = currentUserId && author._id?.toString() === currentUserId.toString();

  const [isLiked, setIsLiked] = useState<boolean>(
    Boolean(currentUserId && post.likes?.includes(currentUserId))
  );
  const [likesCount, setLikesCount] = useState<number>(post.likesCount || 0);
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load comments
  const fetchComments = useCallback(async () => {
    try {
      setIsLoadingComments(true);
      const res = await commentsApi.getComments(post._id);
      if (res.success) {
        setComments(res.comments);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingComments(false);
    }
  }, [post._id]);

  // Check follow status if viewing someone else
  const checkFollowStatus = useCallback(async () => {
    if (!isAuthenticated || isOwner || !author.username) return;
    try {
      const res = await usersApi.getProfile(author.username);
      if (res.success && res.user) {
        setIsFollowing(Boolean(res.user.isFollowing));
      }
    } catch {
      // ignore
    }
  }, [author.username, isAuthenticated, isOwner]);

  useEffect(() => {
    fetchComments();
    checkFollowStatus();
  }, [fetchComments, checkFollowStatus]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await likesApi.toggleLike(post._id);
      if (res.success) {
        setIsLiked(res.liked);
        setLikesCount(res.likesCount);
        onPostUpdated?.({
          ...post,
          likesCount: res.likesCount,
          likes: res.liked
            ? [...(post.likes || []), currentUserId!]
            : (post.likes || []).filter((id) => id !== currentUserId),
        });
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      const res = await commentsApi.addComment(post._id, newComment.trim());
      if (res.success && res.comment) {
        setComments((prev) => [res.comment, ...prev]);
        setNewComment('');
        onPostUpdated?.({
          ...post,
          commentsCount: (post.commentsCount || 0) + 1,
        });
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await commentsApi.deleteComment(commentId);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        onPostUpdated?.({
          ...post,
          commentsCount: Math.max(0, (post.commentsCount || 1) - 1),
        });
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    try {
      if (isFollowing) {
        const res = await usersApi.unfollowUser(author._id);
        if (res.success) setIsFollowing(false);
      } else {
        const res = await usersApi.followUser(author._id);
        if (res.success) setIsFollowing(true);
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/#idea-${post._id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onCreatorClick?.(author.username);
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <img
                src={
                  author.avatar ||
                  `https://api.dicebear.com/7.x/shapes/svg?seed=${author.username}`
                }
                alt={author.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {author.name}
                </h4>
                <p className="text-xs text-slate-500">@{author.username}</p>
              </div>
            </button>

            {!isOwner && isAuthenticated && (
              <button
                id="modal-follow-toggle-btn"
                onClick={handleFollowToggle}
                className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  isFollowing
                    ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              {post.category}
            </span>

            {isOwner && (
              <>
                <button
                  id="modal-edit-post-btn"
                  onClick={() => {
                    onClose();
                    onEdit?.(post);
                  }}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                  title="Edit Idea"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  id="modal-delete-post-btn"
                  onClick={() => {
                    onClose();
                    onDelete?.(post._id);
                  }}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete Idea"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              id="modal-close-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          {/* Post Image */}
          {post.image && (
            <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 max-h-[440px] flex items-center justify-center">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-auto max-h-[440px] object-cover"
              />
            </div>
          )}

          {/* Title & Body */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-4">
              {post.title}
            </h1>
            <div className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {post.description}
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs font-semibold text-slate-600 bg-slate-100/90 px-3 py-1 rounded-lg"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Interaction Bar */}
          <div className="py-3 border-y border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                id="modal-like-btn"
                onClick={handleLike}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isLiked
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-slate-100 text-slate-600 hover:text-rose-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{likesCount} Likes</span>
              </button>

              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 px-2">
                <MessageSquare className="w-4 h-4" />
                <span>{comments.length} Comments</span>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Idea</span>
                </>
              )}
            </button>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-1">
            <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase">
              Discussion & Feedback
            </h3>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                id="comment-input"
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  isAuthenticated
                    ? 'Contribute constructive feedback or ask a question...'
                    : 'Sign in to join the discussion...'
                }
                disabled={!isAuthenticated}
                className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all disabled:opacity-60"
              />
              <button
                id="submit-comment-btn"
                type="submit"
                disabled={isSubmittingComment || !newComment.trim() || !isAuthenticated}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading discussion...</div>
            ) : comments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                Be the first mind to inspire this creator with a thoughtful response!
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {comments.map((c) => {
                  const cAuthor = typeof c.author === 'object' ? c.author : { _id: c.author, name: 'User', username: 'user' };
                  const isCommentOwner = currentUserId && cAuthor._id?.toString() === currentUserId.toString();

                  return (
                    <div
                      key={c._id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start justify-between gap-3 text-sm"
                    >
                      <div className="flex items-start gap-2.5">
                        <img
                          src={
                            cAuthor.avatar ||
                            `https://api.dicebear.com/7.x/shapes/svg?seed=${cAuthor.username}`
                          }
                          alt={cAuthor.name}
                          className="w-7 h-7 rounded-full object-cover bg-white border border-slate-200 mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{cAuthor.name}</span>
                            <span className="text-[11px] text-slate-400">@{cAuthor.username}</span>
                          </div>
                          <p className="text-slate-700 text-xs sm:text-sm mt-1 leading-relaxed">
                            {c.text}
                          </p>
                        </div>
                      </div>

                      {isCommentOwner && (
                        <button
                          onClick={() => handleDeleteComment(c._id)}
                          className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaDetailModal;
