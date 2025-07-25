import React from 'react'
import NavigationBar from './components/NavigationBar'
import Box from '@mui/material/Box'
import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <>
      <NavigationBar />
      <Box
        sx={{
          // pt: '4vh', // Add padding to avoid overlap
          height: '100%', // adjust based on header height
          overflowY: 'hidden',
          width: '100vw',
        }}
      >
        <Outlet />
      </Box>
    </>
  )
}
