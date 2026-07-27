import React from 'react'
import Feed from '../components/Feed'
import RightSidebar from '../components/RightSidebar'

const Home = () => {
  return (
    <div className="flex justify-center">
      <Feed />
      <RightSidebar />
    </div>
  )
}

export default Home