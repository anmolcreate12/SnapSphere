import Notification from "../models/notification_model.js";
import { io, getReceiverSocketId } from "../utils/socket.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.id;
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('sender', 'username profilePicture')
      .populate('post', 'image');
    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.log(error);
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const userId = req.id;
    await Notification.updateMany({ recipient: userId, read: false }, { read: true });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

// generic creator — used by CallContext on the frontend for missed/declined calls,
// since calls don't otherwise have a backend controller to hook into
export const createNotification = async (req, res) => {
  try {
    const senderId = req.id;
    const { recipient, type, callType, status } = req.body;

    if (senderId.toString() === recipient.toString()) {
      return res.status(200).json({ success: true });
    }

    const notification = await Notification.create({
      recipient,
      sender: senderId,
      type,
      callType,
      status
    });
    const populated = await notification.populate('sender', 'username profilePicture');

    const receiverSocketId = getReceiverSocketId(recipient);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newNotification', populated);
    }

    return res.status(201).json({ success: true, notification: populated });
  } catch (error) {
    console.log(error);
  }
};