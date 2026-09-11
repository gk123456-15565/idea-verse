import mongoose, { Schema, Document } from 'mongoose';

export const CATEGORIES = [
  'Technology',
  'Science',
  'Education',
  'Art',
  'Business',
  'Gaming',
  'Environment',
  'Creativity',
  'Innovation',
  'Other',
] as const;

export type IdeaCategory = (typeof CATEGORIES)[number];

export interface IPost extends Document {
  title: string;
  description: string;
  category: IdeaCategory;
  image: string;
  author: mongoose.Types.ObjectId | any;
  tags: string[];
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, 'Idea title is required'],
      trim: true,
      maxlength: [140, 'Title cannot exceed 140 characters'],
    },
    description: {
      type: String,
      required: [true, 'Idea description is required'],
      maxlength: [6000, 'Description cannot exceed 6000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: CATEGORIES,
      default: 'Innovation',
    },
    image: {
      type: String,
      default: '',
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

PostSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Post: mongoose.Model<IPost> = (mongoose.models.Post as any) || mongoose.model<IPost>('Post', PostSchema);
export default Post;
