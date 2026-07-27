import React, { useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { X, ImagePlus, Loader2 } from 'lucide-react'
import { addPost } from '../redux/slices/postSlice'
import { POST_API_END_POINT } from '../utils/constant'

const CreatePost = ({ onClose }) => {
  const dispatch = useDispatch()
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const fileChangeHandler = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const submitHandler = async (e) => {
    e.preventDefault()
    if (!imageFile) {
      setError('Please select an image')
      return
    }
    setError('')
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('caption', caption)
      formData.append('image', imageFile)

      const res = await axios.post(`${POST_API_END_POINT}/addpost`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      })

      if (res.data.success) {
        dispatch(addPost(res.data.post))
        onClose()
      }
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to create post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Create new post</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submitHandler}>
          {/* Image picker / preview */}
          <div className="p-4">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="preview"
                  className="w-full max-h-80 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null)
                    setPreviewUrl(null)
                  }}
                  className="absolute top-2 right-2 bg-zinc-900/80 text-white rounded-full p-1.5 hover:bg-zinc-900"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-700 rounded-xl h-56 cursor-pointer hover:border-zinc-600 transition"
              >
                <ImagePlus size={32} className="text-zinc-500" />
                <p className="text-sm text-zinc-500">Click to select a photo</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={fileChangeHandler}
              className="hidden"
            />
          </div>

          {/* Caption */}
          <div className="px-4 pb-2">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={3}
              className="w-full bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition resize-none"
            />
          </div>

          {error && (
            <p className="px-4 text-sm text-red-400 mb-2">{error}</p>
          )}

          {/* Submit */}
          <div className="px-4 pb-4 pt-2">
            <button
              type="submit"
              disabled={loading || !imageFile}
              className="w-full bg-white text-zinc-900 font-semibold rounded-lg py-2.5 text-sm hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Share'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default CreatePost