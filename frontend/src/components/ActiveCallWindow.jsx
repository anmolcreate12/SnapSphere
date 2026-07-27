import React, { useEffect, useRef } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, MonitorX } from 'lucide-react'
import { useCallContext } from '../context/CallContext'

const ActiveCallWindow = () => {
  const {
    callState,
    callType,
    remoteUserInfo,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    endCall,
    toggleMute,
    toggleCamera,
    startScreenShare,
    stopScreenShare
  } = useCallContext()

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const remoteAudioRef = useRef(null)

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream
  }, [remoteStream])

  if (callState !== 'calling' && callState !== 'in-call') return null

  const isVideoCall = callType === 'video'

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[90] flex flex-col">

      {!isVideoCall && <audio ref={remoteAudioRef} autoPlay />}

      <div className="flex-1 relative flex items-center justify-center">
        {isVideoCall ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-6 right-6 w-40 h-28 object-cover rounded-xl border border-zinc-700 bg-black"
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {remoteUserInfo?.profilePicture ? (
              <img
                src={remoteUserInfo.profilePicture}
                alt={remoteUserInfo.username}
                className="w-28 h-28 rounded-full object-cover border border-zinc-700"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-3xl font-semibold text-zinc-300">
                {remoteUserInfo?.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <p className="text-xl font-semibold text-white">{remoteUserInfo?.username}</p>
          </div>
        )}

        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-zinc-900/80 text-white text-sm px-4 py-2 rounded-full">
          {callState === 'calling' ? `Calling ${remoteUserInfo?.username}...` : remoteUserInfo?.username}
        </div>
      </div>

      <div className="flex items-center justify-center gap-5 py-8">
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-zinc-800 hover:bg-zinc-700'
          } text-white`}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {isVideoCall && (
          <button
            onClick={toggleCamera}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
              isCameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-zinc-800 hover:bg-zinc-700'
            } text-white`}
            aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        )}

        {isVideoCall && callState === 'in-call' && (
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
              isScreenSharing ? 'bg-violet-500 hover:bg-violet-600' : 'bg-zinc-800 hover:bg-zinc-700'
            } text-white`}
            aria-label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isScreenSharing ? <MonitorX size={20} /> : <MonitorUp size={20} />}
          </button>
        )}

        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition"
          aria-label="End call"
        >
          <PhoneOff size={22} />
        </button>
      </div>

    </div>
  )
}

export default ActiveCallWindow