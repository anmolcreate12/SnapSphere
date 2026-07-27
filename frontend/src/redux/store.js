import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import authReducer from './slices/authSlice'
import postReducer from './slices/postSlice'

// Custom storage adapter — works around a Vite bundling issue where the
// default `redux-persist/lib/storage` import resolves incorrectly and
// storage.getItem / storage.setItem come back as undefined.
const storage = {
  getItem: (key) => {
    return Promise.resolve(localStorage.getItem(key))
  },
  setItem: (key, value) => {
    localStorage.setItem(key, value)
    return Promise.resolve()
  },
  removeItem: (key) => {
    localStorage.removeItem(key)
    return Promise.resolve()
  }
}

const rootReducer = combineReducers({
  auth: authReducer,
  post: postReducer
})

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  // Only persist auth — posts should always be fetched fresh from the
  // server, not cached in localStorage (they'll go stale immediately).
  whitelist: ['auth']
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})

export const persistor = persistStore(store)