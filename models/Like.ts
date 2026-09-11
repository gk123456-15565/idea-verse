import mongoose, { Schema, Document } from 'mongoose';

export interface ILike extends Document {
  post: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Prevent duplicate likes at schema level
LikeSchema.index({ post: 1, user: 1 }, { unique: true });

export const Like: mongoose.Model<ILike> = (mongoose.models.Like as any) || mongoose.model<ILike>('Like', LikeSchema);
export default Like;
