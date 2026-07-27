import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { Send, MessageCircle, Phone, Video, PhoneMissed, PhoneOff } from 'lucide-react'
import { useSocketContext } from '../context/SocketContext'
import { useCallContext, decodeCallLog } from '../context/CallContext'
import { MESSAGE_API_END_POINT, USER_API_END_POINT } from '../utils/constant'

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const getPreviewText = (rawText) => {
  const callLog = decodeCallLog(rawText)
  if (callLog) {
    const kind = callLog.callType === 'video' ? 'Video call' : 'Audio call'
    if (callLog.status === 'ended') return `${kind} · ${formatDuration(callLog.duration)}`
    if (callLog.status === 'declined') return `${kind} declined`
    return `Missed ${kind.toLowerCase()}`
  }
  return rawText
}

const CallLogBubble = ({ rawText, isOwnMessage }) => {
  const callLog = decodeCallLog(rawText)
  if (!callLog) return null

  const Icon = callLog.status === 'ended'
    ? (callLog.callType === 'video' ? Video : Phone)
    : (callLog.status === 'declined' ? PhoneOff : PhoneMissed)

  const label = callLog.status === 'ended'
    ? `${callLog.callType === 'video' ? 'Video' : 'Audio'} call · ${formatDuration(callLog.duration)}`
    : callLog.status === 'declined'
      ? 'Call declined'
      : 'Missed call'

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm max-w-[70%] ${
        isOwnMessage ? 'self-end bg-zinc-800 text-zinc-300' : 'self-start bg-zinc-800 text-zinc-300'
      }`}
    >
      <Icon size={15} className={callLog.status === 'ended' ? 'text-zinc-400' : 'text-red-400'} />
      {label}
    </div>
  )
}

const ChatPage = () => {
  const { user } = useSelector((store) => store.auth)
  const { socket, onlineUsers, unreadCounts, setActiveChat } = useSocketContext()
  const { startCall, callState } = useCallContext()
  const [contacts, setContacts] = useState([])
  const [lastMessages, setLastMessages] = useState({})
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (incomingMessage) => {
      setSelectedUser((current) => {
        if (current?._id === incomingMessage.senderId) {
          setMessages((prev) => [...prev, incomingMessage])
        }
        return current
      })
    }

    socket.on('newMessage', handleNewMessage)
    return () => socket.off('newMessage', handleNewMessage)
  }, [socket])

  useEffect(() => {
    return () => setActiveChat(null)
  }, [setActiveChat])

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await axios.get(`${USER_API_END_POINT}/suggested`, {
          withCredentials: true
        })
        if (res.data.success) {
          const mutualFollows = res.data.users.filter((u) => {
            const iFollowThem = user?.following?.includes(u._id)
            const theyFollowMe = user?.followers?.includes(u._id)
            return iFollowThem && theyFollowMe
          })
          setContacts(mutualFollows)

          mutualFollows.forEach(async (contact) => {
            try {
              const msgRes = await axios.post(
                `${MESSAGE_API_END_POINT}/all/${contact._id}`,
                {},
                { withCredentials: true }
              )
              if (msgRes.data.success && msgRes.data.messages?.length > 0) {
                const last = msgRes.data.messages[msgRes.data.messages.length - 1]
                setLastMessages((prev) => ({ ...prev, [contact._id]: getPreviewText(last.messages) }))
              }
            } catch (error) {
              console.log(error)
            }
          })
        }
      } catch (error) {
        console.log(error)
      }
    }
    fetchContacts()
  }, [user])

  const openConversation = async (contact) => {
    setSelectedUser(contact)
    setActiveChat(contact._id)
    setLoadingMessages(true)
    try {
      const res = await axios.post(`${MESSAGE_API_END_POINT}/all/${contact._id}`, {}, {
        withCredentials: true
      })
      if (res.data.success) {
        setMessages(res.data.messages || [])
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendMessageHandler = async (e) => {
    e.preventDefault()
    if (!text.trim() || !selectedUser) return
    try {
      setSending(true)
      const res = await axios.post(
        `${MESSAGE_API_END_POINT}/send/${selectedUser._id}`,
        { message: text },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      )
      if (res.data.success) {
        setMessages([...messages, res.data.newMessage])
        setLastMessages((prev) => ({ ...prev, [selectedUser._id]: getPreviewText(res.data.newMessage.messages) }))
        setText('')
      }
    } catch (error) {
      console.log(error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-screen">

      {/* Contacts list */}
      <div className="w-[320px] border-r border-zinc-800 flex flex-col">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h1 className="text-lg font-semibold text-white">{user?.username}</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8 px-4">
              No conversations yet. You can message people you follow who also follow you back.
            </p>
          ) : (
            contacts.map((contact) => {
              const isOnline = onlineUsers.includes(contact._id)
              const unread = unreadCounts[contact._id] || 0
              return (
                <div
                  key={contact._id}
                  onClick={() => openConversation(contact)}
                  className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition
                    ${selectedUser?._id === contact._id ? 'bg-zinc-900' : 'hover:bg-zinc-900/60'}`}
                >
                  <div className="relative flex-shrink-0">
                    {contact.profilePicture ? (
                      <img
                        src={contact.profilePicture}
                        alt={contact.username}
                        className="w-11 h-11 rounded-full object-cover border border-zinc-700"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-300">
                        {contact.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-zinc-950 rounded-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{contact.username}</p>
                    <p className={`text-xs truncate ${unread > 0 ? 'text-white font-medium' : 'text-zinc-500'}`}>
                      {lastMessages[contact._id] || 'Say hi'}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="bg-violet-500 text-white text-[11px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Active conversation */}
      <div className="flex-1 flex flex-col">
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-500">
            <MessageCircle size={48} />
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800">
              <div className="relative">
                {selectedUser.profilePicture ? (
                  <img
                    src={selectedUser.profilePicture}
                    alt={selectedUser.username}
                    className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300">
                    {selectedUser.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                {onlineUsers.includes(selectedUser._id) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-zinc-950 rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{selectedUser.username}</p>
                <p className="text-xs text-zinc-500">
                  {onlineUsers.includes(selectedUser._id) ? 'Online' : 'Offline'}
                </p>
              </div>

              <button
                onClick={() => startCall(selectedUser, 'audio')}
                disabled={callState !== 'idle'}
                className="text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Audio call"
              >
                <Phone size={20} />
              </button>
              <button
                onClick={() => startCall(selectedUser, 'video')}
                disabled={callState !== 'idle'}
                className="text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Video call"
              >
                <Video size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
              {loadingMessages ? (
                <p className="text-sm text-zinc-500 text-center">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center mt-8">
                  No messages yet. Say hello to {selectedUser.username}.
                </p>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.senderId === user?._id
                  const callLog = decodeCallLog(msg.messages)

                  if (callLog) {
                    return <CallLogBubble key={msg._id} rawText={msg.messages} isOwnMessage={isOwnMessage} />
                  }

                  return (
                    <div
                      key={msg._id}
                      className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                        isOwnMessage
                          ? 'self-end bg-violet-500 text-white rounded-br-sm'
                          : 'self-start bg-zinc-800 text-zinc-100 rounded-bl-sm'
                      }`}
                    >
                      {msg.messages}
                    </div>
                  )
                })
              )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessageHandler} className="flex items-center gap-2 px-5 py-4 border-t border-zinc-800">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="bg-violet-500 hover:bg-violet-600 text-white rounded-full p-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </div>

    </div>
  )
}

export default ChatPage