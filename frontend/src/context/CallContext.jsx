import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { useSocketContext } from './SocketContext'
import { CALL_API_END_POINT, MESSAGE_API_END_POINT, NOTIFICATION_API_END_POINT } from '../utils/constant'

const CallContext = createContext(null)

export const useCallContext = () => useContext(CallContext)

// encode/decode helpers for call-log entries stored as regular chat messages
export const encodeCallLog = (callType, status, durationSeconds) =>
  JSON.stringify({ __callLog: true, callType, status, duration: durationSeconds })

export const decodeCallLog = (text) => {
  try {
    const parsed = JSON.parse(text)
    return parsed?.__callLog ? parsed : null
  } catch {
    return null
  }
}

export const CallProvider = ({ children }) => {
  const { user } = useSelector((store) => store.auth)
  const { socket } = useSocketContext()

  const [callState, setCallState] = useState('idle') // idle | calling | ringing | in-call
  const [callType, setCallType] = useState(null)
  const [remoteUserInfo, setRemoteUserInfo] = useState(null)
  const [incomingCall, setIncomingCall] = useState(null)
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  const pcRef = useRef(null)
  const iceServersRef = useRef([{ urls: 'stun:stun.l.google.com:19302' }])
  const originalVideoTrackRef = useRef(null)
  const callStartTimeRef = useRef(null)
  const remoteUserIdRef = useRef(null)
  const callTypeRef = useRef(null)
  const callStateRef = useRef('idle')

  useEffect(() => {
    callStateRef.current = callState
  }, [callState])

  useEffect(() => {
    if (!user?._id) return
    const fetchIceServers = async () => {
      try {
        const res = await axios.get(`${CALL_API_END_POINT}/ice-servers`, {
          withCredentials: true
        })
        if (res.data.success && res.data.iceServers?.length > 0) {
          iceServersRef.current = res.data.iceServers
        }
      } catch (error) {
        console.log('Falling back to public STUN only:', error)
      }
    }
    fetchIceServers()
  }, [user?._id])

  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current })

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0])
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('iceCandidate', { to: targetUserId, candidate: event.candidate })
      }
    }

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        cleanupCall()
      }
    }

    return pc
  }

  // sends a call-log entry into the chat as a normal message (special JSON
  // payload the chat UI recognizes and renders as a call bubble instead of text)
  const logCallToChat = async (targetUserId, type, status, durationSeconds) => {
    if (!targetUserId) return
    try {
      await axios.post(
        `${MESSAGE_API_END_POINT}/send/${targetUserId}`,
        { message: encodeCallLog(type, status, durationSeconds) },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      )
    } catch (error) {
      console.log(error)
    }
  }

  const notifyMissedOrDeclined = async (targetUserId, type, status) => {
    if (!targetUserId) return
    try {
      await axios.post(
        `${NOTIFICATION_API_END_POINT}/create`,
        { recipient: targetUserId, type: 'call', callType: type, status },
        { withCredentials: true }
      )
    } catch (error) {
      console.log(error)
    }
  }

  const startCall = async (targetUser, type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      })
      setLocalStream(stream)
      setCallType(type)
      callTypeRef.current = type
      setRemoteUserInfo(targetUser)
      remoteUserIdRef.current = targetUser._id
      setCallState('calling')

      const pc = createPeerConnection(targetUser._id)
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))
      pcRef.current = pc

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      socket.emit('callUser', {
        to: targetUser._id,
        from: user._id,
        offer,
        callType: type,
        callerInfo: { _id: user._id, username: user.username, profilePicture: user.profilePicture }
      })
    } catch (error) {
      console.log('Could not start call:', error)
      alert('Could not access camera/microphone. Please check permissions.')
    }
  }

  const acceptCall = async () => {
    if (!incomingCall) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.callType === 'video',
        audio: true
      })
      setLocalStream(stream)
      setCallType(incomingCall.callType)
      callTypeRef.current = incomingCall.callType
      setRemoteUserInfo(incomingCall.callerInfo)
      remoteUserIdRef.current = incomingCall.from

      const pc = createPeerConnection(incomingCall.from)
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))
      pcRef.current = pc

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      socket.emit('answerCall', { to: incomingCall.from, answer })

      callStartTimeRef.current = Date.now()
      setCallState('in-call')
      setIncomingCall(null)
    } catch (error) {
      console.log('Could not accept call:', error)
      alert('Could not access camera/microphone. Please check permissions.')
    }
  }

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit('rejectCall', { to: incomingCall.from })
    }
    setIncomingCall(null)
    setCallState('idle')
  }

  const endCall = () => {
    const targetId = remoteUserIdRef.current
    const type = callTypeRef.current
    const wasInCall = callStateRef.current === 'in-call'
    const durationSeconds = wasInCall && callStartTimeRef.current
      ? Math.round((Date.now() - callStartTimeRef.current) / 1000)
      : 0

    if (targetId) {
      socket.emit('endCall', { to: targetId })
    }

    // log to chat: ended-with-duration if it was actually connected,
    // otherwise it means the caller cancelled before anyone answered
    if (targetId && type) {
      logCallToChat(targetId, type, wasInCall ? 'ended' : 'missed', durationSeconds)
      if (!wasInCall) {
        notifyMissedOrDeclined(targetId, type, 'missed')
      }
    }

    cleanupCall()
  }

  const cleanupCall = () => {
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }
    setLocalStream(null)
    setRemoteStream(null)
    setCallState('idle')
    setCallType(null)
    setRemoteUserInfo(null)
    setIsMuted(false)
    setIsCameraOff(false)
    setIsScreenSharing(false)
    originalVideoTrackRef.current = null
    callStartTimeRef.current = null
    remoteUserIdRef.current = null
    callTypeRef.current = null
  }

  const toggleMute = () => {
    if (!localStream) return
    const audioTrack = localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      setIsMuted(!audioTrack.enabled)
    }
  }

  const toggleCamera = () => {
    if (!localStream) return
    const videoTrack = localStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      setIsCameraOff(!videoTrack.enabled)
    }
  }

  const startScreenShare = async () => {
    if (!pcRef.current) return
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const screenTrack = screenStream.getVideoTracks()[0]

      const videoSender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video')
      if (videoSender) {
        originalVideoTrackRef.current = videoSender.track
        await videoSender.replaceTrack(screenTrack)
      }

      setIsScreenSharing(true)

      screenTrack.onended = () => {
        stopScreenShare()
      }
    } catch (error) {
      console.log('Screen share cancelled or failed:', error)
    }
  }

  const stopScreenShare = async () => {
    if (!pcRef.current || !originalVideoTrackRef.current) return
    const videoSender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video')
    if (videoSender) {
      await videoSender.replaceTrack(originalVideoTrackRef.current)
    }
    setIsScreenSharing(false)
    originalVideoTrackRef.current = null
  }

  useEffect(() => {
    if (!socket) return

    const handleIncomingCall = ({ from, offer, callType: type, callerInfo }) => {
      if (callStateRef.current !== 'idle') return
      setIncomingCall({ from, offer, callType: type, callerInfo })
      setCallState('ringing')
    }

    const handleCallAccepted = async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer))
        callStartTimeRef.current = Date.now()
        setCallState('in-call')
      }
    }

    const handleIceCandidate = async ({ candidate }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (error) {
          console.log('Error adding ICE candidate:', error)
        }
      }
    }

    const handleCallRejected = () => {
      const targetId = remoteUserIdRef.current
      const type = callTypeRef.current
      if (targetId && type) {
        logCallToChat(targetId, type, 'declined', 0)
        notifyMissedOrDeclined(targetId, type, 'declined')
      }
      cleanupCall()
    }

    const handleCallEnded = () => {
      // the other side already logged the call outcome — just clean up UI here
      cleanupCall()
    }

    socket.on('incomingCall', handleIncomingCall)
    socket.on('callAccepted', handleCallAccepted)
    socket.on('iceCandidate', handleIceCandidate)
    socket.on('callRejected', handleCallRejected)
    socket.on('callEnded', handleCallEnded)

    return () => {
      socket.off('incomingCall', handleIncomingCall)
      socket.off('callAccepted', handleCallAccepted)
      socket.off('iceCandidate', handleIceCandidate)
      socket.off('callRejected', handleCallRejected)
      socket.off('callEnded', handleCallEnded)
    }
  }, [socket])

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        remoteUserInfo,
        incomingCall,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        isScreenSharing,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        startScreenShare,
        stopScreenShare
      }}
    >
      {children}
    </CallContext.Provider>
  )
}