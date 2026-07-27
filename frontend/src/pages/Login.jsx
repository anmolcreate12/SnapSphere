import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { setAuthUser } from '../redux/slices/authSlice'
import { USER_API_END_POINT } from '../utils/constant'

const Login = () => {
  const [input, setInput] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value })
  }

  const loginHandler = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setLoading(true)
      const res = await axios.post(`${USER_API_END_POINT}/login`, input, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      })
      if (res.data.success) {
        dispatch(setAuthUser(res.data.user))
        navigate('/')
      }
    } catch (error) {
      setError(error?.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">SnapSphere</h1>
          <p className="text-zinc-400 text-sm mt-2">Welcome back.</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2.5 mb-5">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={loginHandler} className="space-y-5">

          <div className="flex flex-col gap-1">
            <label className="text-zinc-400 text-sm">Email</label>
            <input
              type="email"
              name="email"
              value={input.email}
              onChange={changeEventHandler}
              placeholder="john@example.com"
              className="bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-zinc-400 text-sm">Password</label>
            <input
              type="password"
              name="password"
              value={input.password}
              onChange={changeEventHandler}
              placeholder="••••••••"
              className="bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-zinc-900 font-semibold rounded-lg py-2.5 text-sm hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </button>

        </form>

        {/* Signup Link */}
        <p className="text-zinc-500 text-sm text-center mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-white hover:underline">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Login