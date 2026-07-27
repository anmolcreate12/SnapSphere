import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { setAuthUser } from '../redux/slices/authSlice'
import { USER_API_END_POINT } from '../utils/constant'

const RightSidebar = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((store) => store.auth)
  const [suggestedUsers, setSuggestedUsers] = useState([])

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        const res = await axios.get(`${USER_API_END_POINT}/suggested`, {
          withCredentials: true
        })
        if (res.data.success) {
          setSuggestedUsers(res.data.users)
        }
      } catch (error) {
        console.log(error)
      }
    }
    fetchSuggestedUsers()
  }, [])

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
    <div className="hidden lg:flex flex-col w-[300px] py-8 px-4">

      {/* Logged in user */}
      <Link to={`/profile/${user?._id}`} className="flex items-center gap-3 mb-6">
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={user.username}
            className="w-11 h-11 rounded-full object-cover border border-zinc-700"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-300">
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-white">{user?.username}</p>
          <p className="text-xs text-zinc-500">{user?.bio || 'Welcome to SnapSphere'}</p>
        </div>
      </Link>

      {/* Suggested users */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-zinc-400">Suggested for you</p>
      </div>

      <div className="flex flex-col gap-3">
        {suggestedUsers.slice(0, 5).map((sUser) => {
          const isFollowing = user?.following?.includes(sUser._id)
          return (
            <div key={sUser._id} className="flex items-center gap-3">
              <Link to={`/profile/${sUser._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                {sUser.profilePicture ? (
                  <img
                    src={sUser.profilePicture}
                    alt={sUser.username}
                    className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300">
                    {sUser.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{sUser.username}</p>
                  <p className="text-xs text-zinc-500 truncate">{sUser.bio || 'Suggested for you'}</p>
                </div>
              </Link>
              <button
                onClick={() => followOrUnfollowHandler(sUser._id)}
                className={`text-xs font-semibold flex-shrink-0 ${
                  isFollowing ? 'text-zinc-500 hover:text-zinc-400' : 'text-violet-400 hover:text-violet-300'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default RightSidebar