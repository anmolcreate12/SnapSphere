import React from 'react'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { useCallContext } from '../context/CallContext'

const IncomingCallModal = () => {
  const { callState, incomingCall, acceptCall, rejectCall } = useCallContext()

  if (callState !== 'ringing' || !incomingCall) return null

  const { callerInfo, callType } = incomingCall

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-8 text-center">
        {callerInfo?.profilePicture ? (
          <img
            src={callerInfo.profilePicture}
            alt={callerInfo.username}
            className="w-20 h-20 rounded-full object-cover border border-zinc-700 mx-auto mb-4"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl font-semibold text-zinc-300 mx-auto mb-4">
            {callerInfo?.username?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <p className="text-lg font-semibold text-white mb-1">{callerInfo?.username}</p>
        <p className="text-sm text-zinc-500 mb-8">
          Incoming {callType === 'video' ? 'video' : 'audio'} call...
        </p>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={rejectCall}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white transition"
            aria-label="Decline"
          >
            <PhoneOff size={22} />
          </button>
          <button
            onClick={acceptCall}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white transition"
            aria-label="Accept"
          >
            {callType === 'video' ? <Video size={22} /> : <Phone size={22} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default IncomingCallModal