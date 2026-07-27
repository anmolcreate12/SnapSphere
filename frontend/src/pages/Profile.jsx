import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { Heart, MessageCircle, Trash2, Plus, Bookmark, BookmarkX } from 'lucide-react'
import { deletePost as deletePostFromRedux } from '../redux/slices/postSlice'
import { setAuthUser } from '../redux/slices/authSlice'
import CreatePost from '../components/CreatePost'
import { POST_API_END_POINT, USER_API_END_POINT } from '../utils/constant'

const Profile = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { user: loggedInUser } = useSelector((store) => store.auth)
  const [profileUser, setProfileUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [savedPosts, setSavedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [unsavingId, setUnsavingId] = useState(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')

  const isOwnProfile = loggedInUser?._id === id
  const isFollowing = loggedInUser?.following?.includes(id)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const [profileRes, postsRes] = await Promise.all([
        axios.get(`${USER_API_END_POINT}/${id}/profile`, {
          withCredentials: true
        }),
        axios.get(`${POST_API_END_POINT}/userpost/${id}`, {
          withCredentials: true
        })
      ])

      if (profileRes.data.success) {
        setProfileUser(profileRes.data.user)
        setSavedPosts(profileRes.data.user.bookmarks || [])
      }
      if (postsRes.data.success) {
        setPosts(postsRes.data.posts)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    setActiveTab('posts')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const deleteHandler = async (postId) => {
    const confirmed = window.confirm('Delete this post? This cannot be undone.')
    if (!confirmed) return

    try {
      setDeletingId(postId)
      const res = await axios.post(`${POST_API_END_POINT}/delete/${postId}`, {}, {
        withCredentials: true
      })
      if (res.data.success) {
        setPosts(posts.filter((p) => p._id !== postId))
        dispatch(deletePostFromRedux(postId))
      }
    } catch (error) {
      console.log(error)
    } finally {
      setDeletingId(null)
    }
  }

  const unsaveHandler = async (postId) => {
    try {
      setUnsavingId(postId)
      const res = await axios.post(`${POST_API_END_POINT}/${postId}/bookmark`, {}, {
        withCredentials: true
      })
      if (res.data.success) {
        setSavedPosts(savedPosts.filter((p) => p._id !== postId))

        const updatedBookmarks = (loggedInUser?.bookmarks || []).filter((bId) => bId !== postId)
        dispatch(setAuthUser({ ...loggedInUser, bookmarks: updatedBookmarks }))
      }
    } catch (error) {
      console.log(error)
    } finally {
      setUnsavingId(null)
    }
  }

  const followOrUnfollowHandler = async () => {
    try {
      const res = await axios.post(`${USER_API_END_POINT}/followorunfollow/${id}`, {}, {
        withCredentials: true
      })
      if (res.data.success) {
        const updatedFollowing = isFollowing
          ? loggedInUser.following.filter((fid) => fid !== id)
          : [...(loggedInUser.following || []), id]

        dispatch(setAuthUser({ ...loggedInUser, following: updatedFollowing }))

        setProfileUser((prev) => ({
          ...prev,
          followers: isFollowing
            ? prev.followers.filter((fid) => fid !== loggedInUser._id)
            : [...(prev.followers || []), loggedInUser._id]
        }))
      }
    } catch (error) {
      console.log(error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-zinc-500 text-sm">Loading profile...</p>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-zinc-500 text-sm">User not found.</p>
      </div>
    )
  }

  const displayedPosts = activeTab === 'posts' ? posts : savedPosts

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">

      {/* Header */}
      <div className="flex items-center gap-10 mb-10">
        {profileUser.profilePicture ? (
          <img
            src={profileUser.profilePicture}
            alt={profileUser.username}
            className="w-28 h-28 rounded-full object-cover border border-zinc-700"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-3xl font-semibold text-zinc-300">
            {profileUser.username?.[0]?.toUpperCase() || '?'}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-xl font-semibold text-white">{profileUser.username}</h1>
            {isOwnProfile ? (
              <>
                <a
                  href="/account/edit"
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
                >
                  Edit Profile
                </a>
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="flex items-center gap-1.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
                >
                  <Plus size={16} />
                  Create Post
                </button>
              </>
            ) : (
              <button
                onClick={followOrUnfollowHandler}
                className={`text-sm font-medium px-4 py-1.5 rounded-lg transition ${
                  isFollowing
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    : 'bg-violet-500 hover:bg-violet-600 text-white'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className="flex gap-8 mb-4 text-sm">
            <span className="text-white"><strong>{posts.length}</strong> posts</span>
            <span className="text-white"><strong>{profileUser.followers?.length || 0}</strong> followers</span>
            <span className="text-white"><strong>{profileUser.following?.length || 0}</strong> following</span>
          </div>

          {profileUser.bio && (
            <p className="text-sm text-zinc-300">{profileUser.bio}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-t border-zinc-800">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-1.5 text-sm font-medium py-3 border-t -mt-px transition
            ${activeTab === 'posts'
              ? 'text-white border-white'
              : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
        >
          Posts
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 text-sm font-medium py-3 border-t -mt-px transition
              ${activeTab === 'saved'
                ? 'text-white border-white'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
          >
            <Bookmark size={14} />
            Saved
          </button>
        )}
      </div>

      {/* Posts / Saved grid */}
      {displayedPosts.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-16">
          {activeTab === 'posts' ? 'No posts yet.' : 'No saved posts yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-1 mt-1">
          {displayedPosts.map((post) => (
            <div
              key={post._id}
              className="relative aspect-square group cursor-pointer overflow-hidden"
            >
              <img
                src={post.image}
                alt="post"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-6 text-white text-sm font-semibold">
                <span className="flex items-center gap-1">
                  <Heart size={16} className="fill-white" /> {post.likes?.length || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={16} className="fill-white" /> {post.comments?.length || 0}
                </span>
              </div>

              {activeTab === 'posts' && isOwnProfile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteHandler(post._id)
                  }}
                  disabled={deletingId === post._id}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-red-500/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                  aria-label="Delete post"
                >
                  <Trash2 size={14} />
                </button>
              )}

              {activeTab === 'saved' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    unsaveHandler(post._id)
                  }}
                  disabled={unsavingId === post._id}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-violet-500/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                  aria-label="Remove from saved"
                >
                  <BookmarkX size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreatePost && (
        <CreatePost
          onClose={() => {
            setShowCreatePost(false)
            fetchProfile()
          }}
        />
      )}

    </div>
  )
}

export default Profile