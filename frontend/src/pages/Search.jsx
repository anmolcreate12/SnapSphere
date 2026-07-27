import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { Search as SearchIcon } from 'lucide-react'
import { setAuthUser } from '../redux/slices/authSlice'
import { USER_API_END_POINT } from '../utils/constant'

const Search = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((store) => store.auth)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchUsers(query)
      } else {
        setResults([])
      }
    }, 300) // debounce so we're not firing a request on every keystroke

    return () => clearTimeout(timer)
  }, [query])

  const searchUsers = async (q) => {
    try {
      setLoading(true)
      const res = await axios.get(`${USER_API_END_POINT}/search?query=${encodeURIComponent(q)}`, {
        withCredentials: true
      })
      if (res.data.success) {
        setResults(res.data.users)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const followOrUnfollowHandler = async (targetId) => {
    try {
      const res = await axios.post(`${USER_API_END_POINT}/followorunfollow/${targetId}`, {}, {
        withCredentials: true
      })
      if (res.data.success) {
        const currentlyFollowing = user?.following?.includes(targetId)
        const updatedFollowing = currentlyFollowing
          ? user.following.filter((id) => id !== targetId)
          : [...(user.following || []), targetId]

        dispatch(setAuthUser({ ...user, following: updatedFollowing }))
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-xl font-semibold text-white mb-6">Search</h1>

      <div className="relative mb-6">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username..."
          autoFocus
          className="w-full bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition"
        />
      </div>

      {loading && <p className="text-sm text-zinc-500 text-center">Searching...</p>}

      {!loading && query.trim() && results.length === 0 && (
        <p className="text-sm text-zinc-500 text-center">No users found for "{query}".</p>
      )}

      <div className="flex flex-col gap-3">
        {results.map((result) => {
          const isFollowing = user?.following?.includes(result._id)
          return (
            <div key={result._id} className="flex items-center gap-3">
              <Link to={`/profile/${result._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                {result.profilePicture ? (
                  <img
                    src={result.profilePicture}
                    alt={result.username}
                    className="w-11 h-11 rounded-full object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-300">
                    {result.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{result.username}</p>
                  <p className="text-xs text-zinc-500 truncate">{result.bio || ''}</p>
                </div>
              </Link>
              <button
                onClick={() => followOrUnfollowHandler(result._id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 ${
                  isFollowing
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-violet-500 text-white hover:bg-violet-600'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Search