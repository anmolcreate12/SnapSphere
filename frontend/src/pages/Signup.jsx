import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { USER_API_END_POINT } from '../utils/constant'

const Signup = () => {
  const [input, setInput] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value })
  }

  const signupHandler = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const res = await axios.post(`${USER_API_END_POINT}/register`, input, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      })
      if (res.data.success) {
        navigate('/login')
      }
    } catch (error) {
      console.log(error)
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
          <p className="text-zinc-400 text-sm mt-2">Share your world, your way.</p>
        </div>

        {/* Form */}
        <form onSubmit={signupHandler} className="space-y-5">
          
          <div className="flex flex-col gap-1">
            <label className="text-zinc-400 text-sm">Username</label>
            <input
              type="text"
              name="username"
              value={input.username}
              onChange={changeEventHandler}
              placeholder="john_doe"
              className="bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition"
            />
          </div>

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
            className="w-full bg-white text-zinc-900 font-semibold rounded-lg py-2.5 text-sm hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

        </form>

        {/* Login Link */}
        <p className="text-zinc-500 text-sm text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:underline">
            Log in
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Signup