import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import Post from "../models/post_model.js";
import User from "../models/user_model.js";
import Comment from "../models/comment_model.js";
import Notification from "../models/notification_model.js";
import { io, getReceiverSocketId } from "../utils/socket.js";

export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file;
    const userId = req.id;

    if (!image) {
      return res.status(400).json({ message: 'image required' });
    }

    const optimizedImageBuffer = await sharp(image.buffer).resize({ width: 800, height: 800, fit: 'inside' })
      .toFormat('jpeg', { quality: 80 })
      .toBuffer();

    const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
    const cloudResponse = await cloudinary.uploader.upload(fileUri);

    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: userId
    })

    const user = await User.findById(userId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    await post.populate({ path: 'author', select: '-password' });

    return res.status(201).json({
      message: 'New Post added',
      post,
      success: true
    })

  } catch (error) {
    console.log(error);
  }
}

export const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 })
      .populate({ path: 'author', select: 'username profilePicture' })
      .populate({
        path: 'comments',
        options: { sort: { createdAt: -1 } },
        populate: {
          path: 'author',
          select: 'username profilePicture'
        }
      });
    return res.status(200).json({
      posts,
      success: true
    })

  }
  catch (error) {
    console.log(error);
  }
}

export const getUserPost = async (req, res) => {
  try {
    const authorId = req.params.id;
    const posts = await Post.find({ author: authorId }).sort({ createdAt: -1 }).populate({
      path: 'author',
      select: 'username profilePicture'
    }).populate({
      path: 'comments',
      options: { sort: { createdAt: -1 } },
      populate: {
        path: 'author',
        select: 'username profilePicture'
      }
    })

    return res.status(200).json({
      posts,
      success: true
    })

  } catch (error) {
    console.log(error);
  }
}

export const likePost = async (req, res) => {
  try {
    const likeKrnewAlaUserKiId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found', success: false });

    await Post.findByIdAndUpdate(postId, { $addToSet: { likes: likeKrnewAlaUserKiId } });

    if (post.author.toString() !== likeKrnewAlaUserKiId.toString()) {
      const notification = await Notification.create({
        recipient: post.author,
        sender: likeKrnewAlaUserKiId,
        type: 'like',
        post: postId
      });
      const populated = await notification.populate('sender', 'username profilePicture');
      const receiverSocketId = getReceiverSocketId(post.author.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newNotification', populated);
      }
    }

    return res.status(200).json({ message: 'Post liked', success: true });
  } catch (error) {
    console.log(error);
  }
}

export const dislikePost = async (req, res) => {
  try {
    const likeKrnewAlaUserKiId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found', success: false });

    await Post.findByIdAndUpdate(postId, { $pull: { likes: likeKrnewAlaUserKiId } });

    return res.status(200).json({ message: 'Post disliked', success: true });
  } catch (error) {
    console.log(error);
  }
}

export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentKarneWalaUserKiId = req.id;

    const { text } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found', success: false }); 

    if (!text) return res.status(400).json({ message: 'text is required', success: false });

    const comment = await Comment.create({
      text,
      author: commentKarneWalaUserKiId,
      post: postId
    })

    await comment.populate({
      path: 'author',
      select: 'username profilePicture'
    })

    post.comments.push(comment._id);
    await post.save();

    return res.status(201).json({
      message: 'comment added',
      success: true,
      comment
    })
  } catch (error) {
    console.log(error)
  }
}

export const getCommentsOfPost = async (req, res) => {
  try {
    const postId = req.params.id;

    const comments = await Comment.find({ post: postId }).populate('author', 'username profilePicture');

    if (comments.length === 0) return res.status(404).json({ message: 'No comments found for this post', success: false }); 

    return res.status(200).json({ success: true, comments });

  } catch (error) {
    console.log(error);
  }
}

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found', success: false });

    if (post.author.toString() !== authorId.toString()) return res.status(403).json({ message: 'Unauthorized' });

    await Post.findByIdAndDelete(postId);

    let user = await User.findById(authorId);
    user.posts = user.posts.filter(id => id.toString() !== postId);
    await user.save();

    await Comment.deleteMany({ post: postId });

    return res.status(200).json({
      success: true,
      message: 'Post deleted'
    });
  } catch (error) {
    console.log(error);
  }
}

export const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found', success: false });

    const user = await User.findById(authorId);

    if (user.bookmarks.some(id => id.toString() === post._id.toString())) { 
      await User.findByIdAndUpdate(authorId, { $pull: { bookmarks: post._id } }); 
      return res.status(200).json({ type: 'unsaved', message: 'Post removed from bookmark', success: true });
    } else {
      await User.findByIdAndUpdate(authorId, { $addToSet: { bookmarks: post._id } }); 
      return res.status(200).json({ type: 'saved', message: 'Post bookmarked', success: true });
    }
  } catch (error) {
    console.log(error);
  }
}