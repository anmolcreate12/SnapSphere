import Conversation from "../models/conversation_model.js";
import Message from "../models/message_model.js";
import Notification from "../models/notification_model.js";
import { io, getReceiverSocketId } from "../utils/socket.js";

// for chatting 
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;

    const { message } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    })

    // establish the conversation if not started yet 
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId]
      })
    };
    const newMessage = await Message.create({
      senderId,
      receiverId,
      messages: message
    })
    if (newMessage) conversation.message.push(newMessage._id);
    await Promise.all([conversation.save(), newMessage.save()]);

    // real-time delivery
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    const notification = await Notification.create({
      recipient: receiverId,
      sender: senderId,
      type: 'message'
    });
    const populatedNotification = await notification.populate('sender', 'username profilePicture');
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newNotification", populatedNotification);
    }

    return res.status(201).json({
      success: true,
      newMessage
    })

  } catch (error) {
    console.log(error);
  }
}

export const getMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    }).populate('message');

    if (!conversation) return res.status(200).json({ success: true, message: [] });

    return res.status(200).json({ success: true, messages: conversation?.message });

  } catch (error) {
    console.log(error);
  }
}