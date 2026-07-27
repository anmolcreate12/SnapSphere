import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, UserPlus, MessageCircle, Phone, Video, PhoneMissed } from 'lucide-react'
import { useSocketContext } from '../context/SocketContext'

const timeAgo = (dateString) => {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

const NotificationIcon = ({ type, callType }) => {
  if (type === 'like') return <Heart size={16} className="text-red-500 fill-red-500" />
  if (type === 'follow') return <UserPlus size={16} className="text-violet-400" />
  if (type === 'message') return <MessageCircle size={16} className="text-violet-400" />
  if (type === 'call') return callType === 'video'
    ? <Video size={16} className="text-red-400" />
    : <PhoneMissed size={16} className="text-red-400" />
  return null
}

const notificationText = (n) => {
  if (n.type === 'like') return 'liked your post'
  if (n.type === 'follow') return 'started following you'
  if (n.type === 'message') return 'sent you a message'
  if (n.type === 'call') {
    const kind = n.callType === 'video' ? 'video' : 'audio'
    if (n.status === 'declined') return `declined your ${kind} call`
    return `missed your ${kind} call`
  }
  return ''
}

const notificationLink = (n) => {
  if (n.type === 'message' || n.type === 'call') return '/chat'
  if (n.type === 'follow') return `/profile/${n.sender._id}`
  return `/profile/${n.sender._id}` // like — no dedicated single-post view yet, so link to their profile
}

const Alerts = () => {
  const { notifications, fetchNotifications, markNotificationsRead } = useSocketContext()
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()
    markNotificationsRead()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-xl font-semibold text-white mb-6">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-16">No notifications yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => navigate(notificationLink(n))}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-900 cursor-pointer transition"
            >
              <Link to={`/profile/${n.sender._id}`} onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                {n.sender.profilePicture ? (
                  <img
                    src={n.sender.profilePicture}
                    alt={n.sender.username}
                    className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-300">
                    {n.sender.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200">
                  <span className="font-semibold text-white">{n.sender.username}</span>{' '}
                  {notificationText(n)}
                </p>
                <p className="text-xs text-zinc-500">{timeAgo(n.createdAt)}</p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                <NotificationIcon type={n.type} callType={n.callType} />
                {n.type === 'like' && n.post?.image && (
                  <img src={n.post.image} alt="post" className="w-10 h-10 rounded object-cover" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Alerts