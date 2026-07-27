import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { Heart, MessageCircle, Send, Bookmark, X } from 'lucide-react'
import { setAuthUser } from '../redux/slices/authSlice'
import { USER_API_END_POINT } from '../utils/constant'

const CommentModal = ({ post, comments, liked, likeCount, onLikeToggle, onAddComment, onClose }) => {
  const dispatch = useDispatch()
  const { user } = useSelector((store) => store.auth)
  const [comment, setComment] = useState('')

  const submitHandler = (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    onAddComment(comment)
    setComment('')
  }

  const followOrUnfollowHandler = async (targetId) => {
    try {
      const res = await axios.post(`${USER_API_END_POINT}/followorunfollow/${targetId}`, {}, {
        withCredentials: true
      })
      if (res.data.success) {
        const currentlyFollowing = user?.following?.includes(targetId)
        const updatedFollowing = currentlyFollowing
          ? user.following.filter((id) => id !== targetId)
          : [...(user.following || []), targetId]

        dispatch(setAuthUser({ ...user, following: updatedFollowing }))
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl h-[600px] flex overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-zinc-400 hover:text-white bg-zinc-900/70 rounded-full p-1.5"
        >
          <X size={18} />
        </button>

        {/* Left: image */}
        <div className="w-1/2 bg-black flex items-center justify-center">
          <img src={post.image} alt="post" className="max-h-full max-w-full object-contain" />
        </div>

        {/* Right: comments */}
        <div className="w-1/2 flex flex-col">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
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
            {user?._id !== post.author?._id && (
              <button
                onClick={() => followOrUnfollowHandler(post.author._id)}
                className={`text-xs font-semibold flex-shrink-0 ${
                  user?.following?.includes(post.author?._id)
                    ? 'text-zinc-500 hover:text-zinc-400'
                    : 'text-violet-400 hover:text-violet-300'
                }`}
              >
                {user?.following?.includes(post.author?._id) ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Comment thread */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
            {post.caption && (
              <div className="flex items-start gap-3">
                <Link to={`/profile/${post.author?._id}`} className="flex-shrink-0">
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
                </Link>
                <p className="text-sm text-zinc-300">
                  <Link to={`/profile/${post.author?._id}`} className="font-semibold text-white mr-2 hover:underline">
                    {post.author?.username}
                  </Link>
                  {post.caption}
                </p>
              </div>
            )}

            {comments.length === 0 ? (
              <p className="text-sm text-zinc-500 mt-4 text-center">No comments yet.</p>
            ) : (
              comments.map((c) => (
                <div key={c._id} className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <Link to={`/profile/${c.author?._id}`} className="flex-shrink-0">
                      {c.author?.profilePicture ? (
                        <img
                          src={c.author.profilePicture}
                          alt={c.author.username}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300">
                          {c.author?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </Link>
                    <p className="text-sm text-zinc-300">
                      <Link to={`/profile/${c.author?._id}`} className="font-semibold text-white mr-2 hover:underline">
                        {c.author?.username}
                      </Link>
                      {c.text}
                    </p>
                  </div>
                  {user?._id !== c.author?._id && (
                    <button
                      onClick={() => followOrUnfollowHandler(c.author._id)}
                      className={`text-xs font-semibold flex-shrink-0 ${
                        user?.following?.includes(c.author?._id)
                          ? 'text-zinc-500 hover:text-zinc-400'
                          : 'text-violet-400 hover:text-violet-300'
                      }`}
                    >
                      {user?.following?.includes(c.author?._id) ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-zinc-800 px-4 pt-3">
            <div className="flex items-center gap-4">
              <button onClick={onLikeToggle} aria-label={liked ? 'Unlike' : 'Like'}>
                <Heart size={22} className={liked ? 'fill-red-500 text-red-500' : 'text-zinc-300 hover:text-zinc-400'} />
              </button>
              <button aria-label="Comment">
                <MessageCircle size={22} className="text-zinc-300 hover:text-zinc-400" />
              </button>
              <button aria-label="Share">
                <Send size={22} className="text-zinc-300 hover:text-zinc-400" />
              </button>
              <button className="ml-auto" aria-label="Bookmark">
                <Bookmark size={22} className="text-zinc-300 hover:text-zinc-400" />
              </button>
            </div>
            <p className="text-sm font-semibold text-white mt-2">{likeCount} likes</p>

            {/* Add comment */}
            <form onSubmit={submitHandler} className="flex items-center gap-2 border-t border-zinc-800 py-3 mt-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
              />
              {comment.trim() && (
                <button type="submit" className="text-sm font-semibold text-violet-400 hover:text-violet-300">
                  Post
                </button>
              )}
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}

export default CommentModal