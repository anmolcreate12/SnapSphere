import { createSlice } from '@reduxjs/toolkit'

const postSlice = createSlice({
  name: 'post',
  initialState: {
    posts: []
  },
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload
    },
    addPost: (state, action) => {
      state.posts = [action.payload, ...state.posts]
    },
    deletePost: (state, action) => {
      state.posts = state.posts.filter((post) => post._id !== action.payload)
    }
  }
})

export const { setPosts, addPost, deletePost } = postSlice.actions
export default postSlice.reducer