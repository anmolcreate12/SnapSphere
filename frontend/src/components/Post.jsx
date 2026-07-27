import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react'
import CommentModal from './CommentModal'
import { setAuthUser } from '../redux/slices/authSlice'
import { POST_API_END_POINT, USER_API_END_POINT } from '../utils/constant'

const Post = ({ post }) => {
  const dispatch = useDispatch()
  const { user } = useSelector((store) => store.auth)
  const [liked, setLiked] = useState(post.likes?.includes(user?._id) || false)
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0)
  const [comments, setComments] = useState(post.comments || [])
  const [bookmarked, setBookmarked] = useState(user?.bookmarks?.includes(post._id) || false)
  const [showModal, setShowModal] = useState(false)

  const isOwnPost = user?._id === post.author?._id
  const isFollowing = user?.following?.includes(post.author?._id)

  const likeOrDislikeHandler = async () => {
    try {
      const action = liked ? 'dislike' : 'like'
      const res = await axios.get(`${POST_API_END_POINT}/${post._id}/${action}`, {
        withCredentials: true
      })
      if (res.data.success) {
        setLikeCount(liked ? likeCount - 1 : likeCount + 1)
        setLiked(!liked)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const bookmarkHandler = async () => {
    try {
      const res = await axios.post(`${POST_API_END_POINT}/${post._id}/bookmark`, {}, {
        withCredentials: true
      })
      if (res.data.success) {
        const isSaved = res.data.type === 'saved'
        setBookmarked(isSaved)

        const currentBookmarks = user?.bookmarks || []
        const updatedBookmarks = isSaved
          ? [...currentBookmarks, post._id]
          : currentBookmarks.filter((id) => id !== post._id)

        dispatch(setAuthUser({ ...user, bookmarks: updatedBookmarks }))
      }
    } catch (error) {
      console.log(error)
    }
  }

  const followOrUnfollowHandler = async () => {
    try {
      const res = await axios.post(`${USER_API_END_POINT}/followorunfollow/${post.author._id}`, {}, {
        withCredentials: true
      })
      if (res.data.success) {
        const updatedFollowing = isFollowing
          ? user.following.filter((id) => id !== post.author._id)
          : [...(user.following || []), post.author._id]

        dispatch(setAuthUser({ ...user, following: updatedFollowing }))
      }
    } catch (error) {
      console.log(error)
    }
  }

  const addCommentHandler = async (text) => {
    try {
      const res = await axios.post(
        `${POST_API_END_POINT}/${post._id}/comment`,
        { text },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      )
      if (res.data.success) {
        setComments([res.data.comment, ...comments])
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to={`/profile/${post.author?._id}`} className="flex items-center gap-3 flex-1 min-w-0">
          {post.author?.profilePicture ? (
            <img
              src={post.author.profilePicture}
              alt={post.author.username}
              className="w-8 h-8 rounded-full object-cover border border-zinc-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300">
              {post.author?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <span className="text-sm font-medium text-white">{post.author?.username}</span>
        </Link>

        {!isOwnPost && (
          <button
            onClick={followOrUnfollowHandler}
            className={`text-xs font-semibold ${
              isFollowing ? 'text-zinc-500 hover:text-zinc-400' : 'text-violet-400 hover:text-violet-300'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Image */}
      <img src={post.image} alt="post" className="w-full max-h-[600px] object-cover" />

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 pt-3">
        <button onClick={likeOrDislikeHandler} aria-label={liked ? 'Unlike' : 'Like'}>
          <Heart
            size={22}
            className={liked ? 'fill-red-500 text-red-500' : 'text-zinc-300 hover:text-zinc-400'}
          />
        </button>
        <button onClick={() => setShowModal(true)} aria-label="Comment">
          <MessageCircle size={22} className="text-zinc-300 hover:text-zinc-400" />
        </button>
        <button aria-label="Share">
          <Send size={22} className="text-zinc-300 hover:text-zinc-400" />
        </button>
        <button onClick={bookmarkHandler} className="ml-auto" aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
          <Bookmark
            size={22}
            className={bookmarked ? 'fill-violet-400 text-violet-400' : 'text-zinc-300 hover:text-zinc-400'}
          />
        </button>
      </div>

      {/* Like count */}
      <p className="text-sm font-semibold text-white px-4 mt-2">{likeCount} likes</p>

      {/* Caption */}
      {post.caption && (
        <p className="text-sm text-zinc-300 px-4 mt-1">
          <span className="font-semibold text-white mr-2">{post.author?.username}</span>
          {post.caption}
        </p>
      )}

      {/* View comments trigger */}
      <button
        onClick={() => setShowModal(true)}
        className="text-sm text-zinc-500 px-4 mt-1 mb-3 block hover:text-zinc-400"
      >
        {comments.length > 0 ? `View all ${comments.length} comments` : 'Add a comment...'}
      </button>

      {showModal && (
        <CommentModal
          post={post}
          comments={comments}
          liked={liked}
          likeCount={likeCount}
          onLikeToggle={likeOrDislikeHandler}
          onAddComment={addCommentHandler}
          onClose={() => setShowModal(false)}
        />
      )}

    </div>
  )
}

export default Post