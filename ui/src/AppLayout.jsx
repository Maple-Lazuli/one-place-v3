import React from 'react'
import NavigationBar from './components/NavigationBar'
import Box from '@mui/material/Box'
import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <>
      <NavigationBar />
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Outlet />
      </Box>
    </>
  )
}
