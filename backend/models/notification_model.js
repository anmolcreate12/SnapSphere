import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'follow', 'message', 'call'], required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  callType: { type: String, enum: ['audio', 'video'] },
  status: { type: String }, // e.g. 'missed', 'declined' — only used for type 'call'
  read: { type: Boolean, default: false }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;