import  User from "../models/user_model.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import Post from "../models/post_model.js";
import Notification from "../models/notification_model.js";
import { io, getReceiverSocketId } from "../utils/socket.js";



export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(401).json({
        message: "something is missing, please check",
        success: false
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({
        message: "email already taken",
        success: false
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      password: hashedPassword
    })

    return res.status(201).json({
      message: "account created succesfully",
      success: true
    });
  } catch (error) {
    console.log(error.message)
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        message: "something is missing, please check",
        success: false
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "wrong password or email",
        success: false
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "wrong password or email",
        success: false
      });
    }
    const token = await jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' });
    
    // populate each post if in the posts array
    const populatedPosts = await Promise.all(
      user.posts.map(async (postId)=>{
        const post = await Post.findById(postId);
        if(post.author.equals(user._id)){
          return post;
        }
        return null;
      })
    )

    user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      post: user.posts,
      bookmarks: user.bookmarks,

    }

    const isProduction = process.env.NODE_ENV === 'production';

    return res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 1 * 24 * 60 * 60 * 1000
    }).json({
      message: `welcome back ${user.username})`,
      success: true,
      user
    })

  } catch (error) {
    console.log(error.message);
  }
}

export const logout = async (_, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    return res.cookie('token', "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 0
    }).json({
      message: 'logged out successfully',
      success: true
    })
  } catch (error) {
    console.log(error.message)
  }
}

export const getProfile = async (req, res) => {
  try {
    

    const userId = req.params.id;
    let user = await User.findById(userId)
      .select('-password')
      .populate({
        path: 'bookmarks',
        populate: { path: 'author', select: 'username profilePicture' }
      });
    return res.status(200).json({
      user,
      success: true
    });
  } catch (error) {
    console.log(error);
  }
};

export const editProfile = async (req, res) => {
  try {
    
    const userId = req.id;
    const { bio, gender } = req.body;
    const profilePicture = req.file;
    let cloudResponse;

    if (profilePicture) {
      const fileUri = getDataUri(profilePicture);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'User not find',
        success: false
      })
    }

    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (profilePicture) user.profilePicture = cloudResponse.secure_url;

    await user.save();

    return res.status(200).json({
      message: 'profile updated',
      success: true,
      user
    })


  } catch (error) {
    console.log(error);
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select("-password");
    if (!suggestedUsers) {
      return res.status(400).json({
        message: 'Currently do not have any users',
      });
    }
    return res.status(200).json({
      success: true,
      users: suggestedUsers
    });
  } catch (error) {
    console.log(error); 
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || !query.trim()) {
      return res.status(200).json({ success: true, users: [] });
    }
    const users = await User.find({
      _id: { $ne: req.id },
      username: { $regex: query, $options: 'i' }
    }).select('-password').limit(20);

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.log(error);
  }
};

export const followOrUnfollow = async (req, res) => {
  try {
    const followKrnwala = req.id; // patel
    const jiskoFollowKrunga = req.params.id; // shivani
    if (followKrnwala === jiskoFollowKrunga) {
      return res.status(400).json({
        message: 'You cannot follow/unfollow yourself',
        success: false
      });
    }

    const user = await User.findById(followKrnwala);
    const targetUser = await User.findById(jiskoFollowKrunga);

    if (!user || !targetUser) {
      return res.status(400).json({
        message: 'User not found',
        success: false
      });
    }

    // mai check krunga ki follow krna hai ya unfollow
    const isFollowing = user.following.includes(jiskoFollowKrunga);
    if (isFollowing) {
      // unfollow logic ayege
      await Promise.all([
        User.updateOne({ _id: followKrnwala }, { $pull: { following: jiskoFollowKrunga } }),
        User.updateOne({ _id: jiskoFollowKrunga }, { $pull: { followers: followKrnwala } })
      ]);
      return res.status(200).json({ message: 'unfollowed successsfully', success: true });
    } else {
      // follow logic ayege
      await Promise.all([
        User.updateOne({ _id: followKrnwala }, { $push: { following: jiskoFollowKrunga } }),
        User.updateOne({ _id: jiskoFollowKrunga }, { $push: { followers: followKrnwala } })
      ]);

      const notification = await Notification.create({
        recipient: jiskoFollowKrunga,
        sender: followKrnwala,
        type: 'follow'
      });
      const populated = await notification.populate('sender', 'username profilePicture');
      const receiverSocketId = getReceiverSocketId(jiskoFollowKrunga);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newNotification', populated);
      }

      return res.status(200).json({ message: 'followed successsfully', success: true });
    }
  } catch (error) {
    console.log(error);
  }
};