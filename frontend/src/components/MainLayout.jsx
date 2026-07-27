import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LeftSidebar from './LeftSidebar'
import IncomingCallModal from './IncomingCallModal'
import ActiveCallWindow from './ActiveCallWindow'

const MainLayout = () => {
  const { user } = useSelector((store) => store.auth)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex bg-zinc-950 min-h-screen">
      <LeftSidebar />
      <div className="flex-1 md:ml-[240px]">
        <Outlet />
      </div>
      <IncomingCallModal />
      <ActiveCallWindow />
    </div>
  )
}

export default MainLayout