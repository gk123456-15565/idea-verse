import React, { useState, useEffect } from 'react';
import {
  Upload,
  X,
  Sparkles,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Tag,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { IdeaCategory, IdeaPost } from '../types';
import { postsApi } from '../services/api';
import { CATEGORY_ITEMS } from '../components/CategoryBar';

interface ShareIdeaPageProps {
  editingPost?: IdeaPost | null;
  onPostCreated: (post: IdeaPost) => void;
  onCancel: () => void;
}

export const ShareIdeaPage: React.FC<ShareIdeaPageProps> = ({
  editingPost,
  onPostCreated,
  onCancel,
}) => {
  const isEditing = Boolean(editingPost);

  const [title, setTitle] = useState(editingPost?.title || '');
  const [description, setDescription] = useState(editingPost?.description || '');
  const [category, setCategory] = useState<IdeaCategory>(
    (editingPost?.category as IdeaCategory) || 'Innovation'
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(editingPost?.tags || []);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(editingPost?.image || '');
  const [isDragOver, setIsDragOver] = useState(false);

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title);
      setDescription(editingPost.description);
      setCategory(editingPost.category);
      setTags(editingPost.tags || []);
      setImagePreview(editingPost.image || '');
    }
  }, [editingPost]);

  const handleImageFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Only JPG, JPEG, PNG, or WEBP images are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size cannot exceed 5MB.');
      return;
    }
    setErrorMsg('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.replace(/#/g, '').trim();
      if (clean && !tags.includes(clean) && tags.length < 6) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter an idea title.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please describe your idea or concept.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('tags', JSON.stringify(tags));

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (editingPost && !imagePreview) {
        formData.append('imageUrl', '');
      }

      let res;
      if (isEditing && editingPost) {
        res = await postsApi.updatePost(editingPost._id, formData);
      } else {
        res = await postsApi.createPost(formData);
      }

      if (res.success && res.post) {
        onPostCreated(res.post);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isPreviewMode ? 'Exit Preview' : 'Preview Idea'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isEditing ? 'Edit Your Idea' : 'Publish an Idea to IDEAVERSE'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Focus on clarity, innovation, and depth. Good ideas inspire minds.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isPreviewMode ? (
          /* Live Preview Mode */
          <div className="space-y-4 py-4 border border-blue-100 bg-blue-50/20 p-6 rounded-2xl">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {category}
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">
              {title || 'Untitled Idea'}
            </h2>
            {imagePreview && (
              <div className="rounded-2xl overflow-hidden bg-slate-100 max-h-96">
                <img src={imagePreview} alt="Preview" className="w-full h-auto object-cover" />
              </div>
            )}
            <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
              {description || 'No description provided yet.'}
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {tags.map((t, i) => (
                  <span key={i} className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Main Creation Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Title / Concept
                </label>
                <span className="text-[11px] text-slate-400">{140 - title.length} chars</span>
              </div>
              <input
                id="idea-title-input"
                type="text"
                required
                maxLength={140}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your idea a clear, compelling title..."
                className="w-full px-4 py-3 text-base font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                Category
              </label>
              <select
                id="idea-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as IdeaCategory)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:border-blue-500 outline-hidden transition-all"
              >
                {CATEGORY_ITEMS.filter((c) => c.name !== 'All').map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Detailed Explanation & Concept
                </label>
                <span className="text-[11px] text-slate-400">{6000 - description.length} chars left</span>
              </div>
              <textarea
                id="idea-description-input"
                required
                rows={7}
                maxLength={6000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what the idea is, why it matters, what technical or creative problem it solves, and how others can build on it..."
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all leading-relaxed"
              />
            </div>

            {/* Image Upload Area */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                Illustration, Blueprint or Photograph (optional)
              </label>

              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-80 flex items-center justify-center group">
                  <img
                    src={imagePreview}
                    alt="Uploaded preview"
                    className="w-full h-auto max-h-80 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer shadow-md"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 mb-1">
                    Drag and drop your idea's visual schematic here, or{' '}
                    <label
                      htmlFor="post-image-file"
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      browse
                    </label>
                  </p>
                  <p className="text-[11px] text-slate-400">Supports JPG, PNG, or WEBP up to 5MB</p>
                  <input
                    id="post-image-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                Tags (Max 6 tags - press Enter or comma)
              </label>
              <div className="flex flex-wrap gap-2 items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-blue-500 transition-all">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg shadow-2xs"
                  >
                    #{tag}
                    <X
                      className="w-3 h-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </span>
                ))}
                {tags.length < 6 && (
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={tags.length === 0 ? 'Type tag and hit Enter...' : ''}
                    className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-800 outline-hidden py-1"
                  />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="publish-idea-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? isEditing
                      ? 'Saving...'
                      : 'Publishing...'
                    : isEditing
                    ? 'Save Changes'
                    : 'Publish Idea'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ShareIdeaPage;
