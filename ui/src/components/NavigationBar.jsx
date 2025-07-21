import React, { useEffect, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import { Link, useNavigate } from 'react-router-dom'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert from '@mui/material/Alert'

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

export default function NavigationBar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [username, setUsername] = useState(null)
  const [snack, setSnack] = useState({ open: false, severity: 'info', message: '' })
  const navigate = useNavigate()

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open)
  }

  // Fetch username from backend API on mount
  useEffect(() => {
    async function fetchUsername() {
      try {
        const res = await fetch('/api/users/get_name', {
          method: 'GET',
          credentials: 'include', // include cookies for session token
        })

        if (res.ok) {
          const data = await res.json()
          if (data.status === 'success' && data.name) {
            setUsername(data.name)
          } else {
            setUsername(null)
          }
        } else {
          // If session invalid or other error, clear username
          setUsername(null)
        }
      } catch (err) {
        console.error('Error fetching username:', err)
        setUsername(null)
      }
    }

    fetchUsername()
  }, [])

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/users/logout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        setSnack({ open: true, severity: 'success', message: 'Logged out successfully' })
      } else {
        setSnack({ open: true, severity: 'error', message: data.message || 'Logout failed' })
      }
    } catch (err) {
      setSnack({ open: true, severity: 'error', message: 'Network error during logout' })
    } finally {
      setUsername(null)
      setDrawerOpen(false)
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    }
  }

  const drawerContent = (
    <Box
      sx={{ width: 250, p: 2 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        {username}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Button variant="outlined" fullWidth sx={{ mb: 2 }} component={Link} to="/update_account">
        Edit Account
      </Button>
      <Button variant="outlined" fullWidth sx={{ mb: 2 }} component={Link} to="/db">
        DB Management
      </Button>
      <Button
        variant="contained"
        fullWidth
        color="error"
        onClick={(e) => {
          e.stopPropagation()
          handleLogout()
        }}
      >
        Log Out
      </Button>
    </Box>
  )

  return (
    <>
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <Button component={Link} to="/home" color="inherit" sx={{ fontWeight: 'bold' }}>
            Home
          </Button>
          <Button component={Link} to="/projects" color="inherit">
            Projects
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          {!username && (
            <Button component={Link} to="/login" color="inherit">
              Login
            </Button>
          )}
          {username && (
            <Avatar
              sx={{
                bgcolor: 'secondary.main',
                cursor: 'pointer',
                width: 32,
                height: 32,
                fontSize: '1rem',
              }}
              onClick={toggleDrawer(true)}
            >
              {username.charAt(0).toUpperCase()}
            </Avatar>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
        {drawerContent}
      </Drawer>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack({ ...snack, open: false })}
          severity={snack.severity}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  )
}
