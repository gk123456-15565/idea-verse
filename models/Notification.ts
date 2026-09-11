import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'like' | 'comment' | 'follow' | 'system';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId | any;
  sender: mongoose.Types.ObjectId | any;
  type: NotificationType;
  post?: mongoose.Types.ObjectId | any;
  text: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['like', 'comment', 'follow', 'system'],
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    text: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification: mongoose.Model<INotification> = (mongoose.models.Notification as any) || mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
