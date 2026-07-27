import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import {
  Compass,
  Search,
  SquarePlus,
  Send,
  Bell,
  Sparkles,
  LogOut
} from 'lucide-react'
import { setAuthUser } from '../redux/slices/authSlice'
import { useSocketContext } from '../context/SocketContext'
import CreatePost from './CreatePost'
import { USER_API_END_POINT } from '../utils/constant'

const LeftSidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((store) => store.auth)
  const { totalUnread, unreadNotificationCount } = useSocketContext()
  const [showCreatePost, setShowCreatePost] = useState(false)

  const sidebarItems = [
    { icon: <Compass size={22} />, text: 'Home', path: '/' },
    { icon: <Search size={22} />, text: 'Search', path: '/search' },
    { icon: <SquarePlus size={22} />, text: 'Create', path: 'create' },
    { icon: <Send size={22} />, text: 'Messages', path: '/chat', badge: totalUnread },
    { icon: <Bell size={22} />, text: 'Alerts', path: '/alerts', badge: unreadNotificationCount },
  ]

  const isActive = (path) => path !== '#' && path !== 'create' && location.pathname === path

  const sidebarHandler = (item) => {
    if (item.path === '#') return
    if (item.path === 'create') {
      setShowCreatePost(true)
      return
    }
    navigate(item.path)
  }

  const logoutHandler = async () => {
    try {
      await axios.get(`${USER_API_END_POINT}/logout`, {
        withCredentials: true
      })
      dispatch(setAuthUser(null))
      navigate('/login')
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-[240px] bg-zinc-950 border-r border-zinc-800 px-3 py-6">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 px-3 mb-10">
        <Sparkles size={22} className="text-violet-400" />
        <h1 className="text-xl font-bold text-white tracking-tight">SnapSphere</h1>
      </Link>

      {/* Nav items */}
      <div className="flex flex-col gap-1">
        {sidebarItems.map((item, index) => {
          const active = isActive(item.path)
          return (
            <div
              key={index}
              onClick={() => sidebarHandler(item)}
              className={`relative flex items-center gap-4 px-3 py-3 rounded-xl cursor-pointer transition
                ${active
                  ? 'bg-violet-500/10 text-violet-300'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-violet-400 rounded-full" />
              )}
              {item.icon}
              <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>
                {item.text}
              </span>
              {item.badge > 0 && (
                <span className="ml-auto bg-violet-500 text-white text-[11px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom section: Profile + Logout, pinned to bottom */}
      <div className="mt-auto flex flex-col gap-1">

        <div
          onClick={() => navigate(`/profile/${user?._id}`)}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition
            ${isActive(`/profile/${user?._id}`)
              ? 'bg-violet-500/10 text-violet-300'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            }`}
        >
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.username}
              className="w-7 h-7 rounded-full object-cover border border-zinc-700"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <span className="text-sm font-medium truncate">
            {user?.username || 'Profile'}
          </span>
        </div>

        <div
          onClick={logoutHandler}
          className="flex items-center gap-4 px-3 py-3 rounded-xl cursor-pointer text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition"
        >
          <LogOut size={22} />
          <span className="text-sm font-medium">Logout</span>
        </div>

      </div>

      {showCreatePost && (
        <CreatePost onClose={() => setShowCreatePost(false)} />
      )}

    </div>
  )
}

export default LeftSidebar