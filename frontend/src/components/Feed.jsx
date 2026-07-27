import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import Post from './Post'
import { setPosts } from '../redux/slices/postSlice'
import { POST_API_END_POINT } from '../utils/constant'

const Feed = () => {
  const dispatch = useDispatch()
  const { posts } = useSelector((store) => store.post)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const res = await axios.get(`${POST_API_END_POINT}/all`, {
          withCredentials: true
        })
        if (res.data.success) {
          dispatch(setPosts(res.data.posts))
        }
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false)
      }
    }
    fetchAllPosts()
  }, [dispatch])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-zinc-500 text-sm">Loading posts...</p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-zinc-500 text-sm">No posts yet. Be the first to share something.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[470px] mx-auto py-6">
      {posts.map((post) => (
        <Post key={post._id} post={post} />
      ))}
    </div>
  )
}

export default Feed