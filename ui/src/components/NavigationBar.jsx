import React, { useEffect, useState, useRef } from 'react'
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Drawer,
  Typography,
  Avatar,
  Divider,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

export default function NavigationBar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [username, setUsername] = useState(null)
  const [snack, setSnack] = useState({ open: false, severity: 'info', message: '', renew: false })
  const navigate = useNavigate()
  const intervalRef = useRef(null)

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open)
  }

  // Check session validity and fetch username
  useEffect(() => {
    async function initSessionCheck() {
      const sessionOk = await checkSession()
      if (!sessionOk) return

      await fetchUsername()

      // Start periodic session timer
      intervalRef.current = setInterval(checkSession, 60000)
    }

    initSessionCheck()

    return () => clearInterval(intervalRef.current)
  }, [])

  // Check session validity
  const checkSession = async () => {
    try {
      const res = await fetch('/api/users/session', { credentials: 'include' })
      if (!res.ok) {
        navigate('/login')
        return false
      }

      const data = await res.json()
      if (data.status !== 'success' || !data.active) {
        navigate('/login')
        return false
      }

      const timeLeft = data.endTime * 1000 - Date.now()
      if (timeLeft <= 10 * 60 * 1000) { // Less than 10 minutes left
        setSnack({
          open: true,
          severity: 'warning',
          message: 'Session expiring soon. Click to renew.',
          renew: true
        })
      }

      return true
    } catch (err) {
      console.error('Session check failed:', err)
      navigate('/login')
      return false
    }
  }

  // Fetch username
  const fetchUsername = async () => {
    try {
      const res = await fetch('/api/users/get_name', {
        method: 'GET',
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        if (data.status === 'success' && data.name) {
          setUsername(data.name)
        } else {
          setUsername(null)
        }
      } else {
        setUsername(null)
      }
    } catch (err) {
      console.error('Error fetching username:', err)
      setUsername(null)
    }
  }

  const handleRenew = async () => {
    try {
      const res = await fetch('/api/users/new_session', {
        method: 'GET',
        credentials: 'include'
      })

      const data = await res.json()

      if (!res.ok || data.status !== 'success') {
        navigate('/login')
        return
      }

      setSnack({
        open: true,
        severity: 'success',
        message: 'Session renewed successfully',
        renew: false
      })
    } catch (err) {
      console.error('Session renewal failed:', err)
      navigate('/login')
    }
  }

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
            <Button variant="outlined" fullWidth sx={{ mb: 2 }} component={Link} to="/delete_tags">
        Delete Tags
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
          <Button component={Link} to="/" color="inherit" sx={{ fontWeight: 'bold' }}>
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
        autoHideDuration={snack.renew ? null : 3000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack({ ...snack, open: false })}
          severity={snack.severity}
          action={
            snack.renew && (
              <Button color="inherit" size="small" onClick={handleRenew}>
                RENEW
              </Button>
            )
          }
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  )
}
