import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { Loader2, ImagePlus } from 'lucide-react'
import { setAuthUser } from '../redux/slices/authSlice'
import { USER_API_END_POINT } from '../utils/constant'

const EditProfile = () => {
  const { user } = useSelector((store) => store.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [previewUrl, setPreviewUrl] = useState(user?.profilePicture || null)
  const [profilePictureFile, setProfilePictureFile] = useState(null)
  const [bio, setBio] = useState(user?.bio || '')
  const [gender, setGender] = useState(user?.gender || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fileChangeHandler = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setProfilePictureFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const submitHandler = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('bio', bio)
      formData.append('gender', gender)
      if (profilePictureFile) {
        formData.append('profilePicture', profilePictureFile)
      }

      const res = await axios.post(`${USER_API_END_POINT}/profile/edit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      })

      if (res.data.success) {
        dispatch(setAuthUser({ ...user, ...res.data.user }))
        navigate(`/profile/${user._id}`)
      }
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-xl font-semibold text-white mb-8">Edit Profile</h1>

      <form onSubmit={submitHandler} className="space-y-6">

        {/* Profile picture */}
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={user?.username}
              className="w-16 h-16 rounded-full object-cover border border-zinc-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-semibold text-zinc-300">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{user?.username}</p>
            <p className="text-xs text-zinc-500">{user?.bio || 'No bio yet'}</p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            <ImagePlus size={16} />
            Change photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={fileChangeHandler}
            className="hidden"
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1">
          <label className="text-zinc-400 text-sm">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell people about yourself..."
            className="bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition resize-none"
          />
        </div>

        {/* Gender */}
        <div className="flex flex-col gap-1">
          <label className="text-zinc-400 text-sm">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="bg-zinc-800 text-white border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition"
          >
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-zinc-900 font-semibold rounded-lg px-5 py-2.5 text-sm hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/profile/${user?._id}`)}
            className="text-sm font-medium text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  )
}

export default EditProfile