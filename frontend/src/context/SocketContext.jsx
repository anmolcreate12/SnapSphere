import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { io } from 'socket.io-client'
import { NOTIFICATION_API_END_POINT, SOCKET_URL } from '../utils/constant'

const SocketContext = createContext(null)

export const useSocketContext = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const { user } = useSelector((store) => store.auth)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({}) // { senderId: count } — messages
  const [notifications, setNotifications] = useState([])
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const socketRef = useRef(null)
  const activeChatIdRef = useRef(null)

  useEffect(() => {
    if (!user?._id) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    const socket = io(SOCKET_URL, {
      query: { userId: user._id }
    })
    socketRef.current = socket

    socket.on('getOnlineUsers', (users) => {
      setOnlineUsers(users)
    })

    socket.on('newMessage', (message) => {
      if (activeChatIdRef.current !== message.senderId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.senderId]: (prev[message.senderId] || 0) + 1
        }))
      }
    })

    socket.on('newNotification', (notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadNotificationCount((prev) => prev + 1)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?._id])

  const setActiveChat = (userId) => {
    activeChatIdRef.current = userId
    if (userId) {
      setUnreadCounts((prev) => {
        const updated = { ...prev }
        delete updated[userId]
        return updated
      })
    }
  }

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${NOTIFICATION_API_END_POINT}/all`, {
        withCredentials: true
      })
      if (res.data.success) {
        setNotifications(res.data.notifications)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const markNotificationsRead = async () => {
    try {
      await axios.post(`${NOTIFICATION_API_END_POINT}/mark-read`, {}, {
        withCredentials: true
      })
      setUnreadNotificationCount(0)
    } catch (error) {
      console.log(error)
    }
  }

  const totalUnreadMessages = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        onlineUsers,
        unreadCounts,
        totalUnread: totalUnreadMessages,
        setActiveChat,
        notifications,
        unreadNotificationCount,
        fetchNotifications,
        markNotificationsRead
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}