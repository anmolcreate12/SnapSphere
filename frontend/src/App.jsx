import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import ChatPage from './pages/ChatPage'
import MainLayout from './components/MainLayout'
import Search from './pages/Search'
import Alerts from './pages/Alerts'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/profile/:id', element: <Profile /> },
      { path: '/account/edit', element: <EditProfile /> },
      { path: '/chat', element: <ChatPage /> },
    ]
  },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/search', element: <Search /> },
  { path: '/alerts', element: <Alerts /> },
])

function App() {
  return <RouterProvider router={router} />
}

export default App