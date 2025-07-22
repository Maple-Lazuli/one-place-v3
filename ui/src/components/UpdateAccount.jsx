import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Divider
} from '@mui/material'

import { useNavigate } from 'react-router-dom'

export default function UpdateUserAccount () {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password1, setPassword1] = useState('')
  const [password2, setPassword2] = useState('')

  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [preferences, setPreferences] = useState('')

  const [deletePassword, setDeletePassword] = useState('')

  const [snack, setSnack] = useState({
    open: false,
    severity: 'info',
    message: ''
  })

  useEffect(() => {
    async function fetchUsername () {
      try {
        const res = await fetch('/api/users/get_name', {
          credentials: 'include'
        })
        const data = await res.json()
        if (res.ok && data.status === 'success') {
          setUsername(data.name)
        } else {
          setSnack({
            open: true,
            severity: 'error',
            message: data.message || 'Could not fetch username'
          })
        }
      } catch (err) {
        setSnack({
          open: true,
          severity: 'error',
          message: 'Network error fetching username'
        })
      }
    }
    fetchUsername()
  }, [])

  const showSnack = (message, severity = 'info') => {
    setSnack({ open: true, message, severity })
  }

  async function handleUsernameUpdate (e) {
    e.preventDefault()
    if (!newUsername.trim())
      return showSnack('Please enter a new username', 'warning')
    if (!password1)
      return showSnack('Please enter your current password', 'warning')

    try {
      const res = await fetch('/api/users/update_user_name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username,
          new_username: newUsername.trim(),
          password: password1
        })
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        showSnack(data.message, 'success')
        setUsername(newUsername.trim())
      } else {
        showSnack(data.message || 'Failed to update username', 'error')
      }
    } catch {
      showSnack('Network error updating username', 'error')
    }
  }

  async function handlePasswordUpdate (e) {
    e.preventDefault()
    if (!newPassword) return showSnack('Please enter a new password', 'warning')
    if (newPassword !== confirmNewPassword)
      return showSnack('New passwords do not match', 'warning')
    if (!password2)
      return showSnack('Please enter your current password', 'warning')

    try {
      const res = await fetch('/api/users/update_user_password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username,
          new_password: newPassword,
          password: password2
        })
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        showSnack(data.message, 'success')
        setNewPassword('')
        setConfirmNewPassword('')
      } else {
        showSnack(data.message || 'Failed to update password', 'error')
      }
    } catch {
      showSnack('Network error updating password', 'error')
    }
  }

  async function handlePreferencesUpdate (e) {
    e.preventDefault()
    if (!preferences.trim())
      return showSnack('Please enter preferences', 'warning')
    if (!password1)
      return showSnack('Please enter your current password', 'warning')

    try {
      const res = await fetch('/api/users/update_user_preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username,
          preferences: preferences.trim()
        })
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        showSnack(data.message, 'success')
      } else {
        showSnack(data.message || 'Failed to update preferences', 'error')
      }
    } catch {
      showSnack('Network error updating preferences', 'error')
    }
  }

  async function handleAccountDeletion (e) {
    e.preventDefault()
    if (!deletePassword)
      return showSnack('Please enter your password', 'warning')

    const confirm = window.confirm(
      'Are you sure you want to permanently delete your account? This cannot be undone.'
    )
    if (!confirm) return

    try {
      const res = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password: deletePassword
        })
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        showSnack(data.message || 'Account deleted', 'success')
        setUsername(null)
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      } else {
        showSnack(data.message || 'Failed to delete account', 'error')
      }
    } catch {
      showSnack('Network error deleting account', 'error')
    }
  }

  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: 'auto',
        p: 2,
        overflowY: 'auto',
        height: '95vh'
      }}
    >
      <Typography variant='h4' gutterBottom>
        Update Account
      </Typography>

      {/* Change Username */}
      <form onSubmit={handleUsernameUpdate}>
        <Typography variant='h6'>Change Username</Typography>
        <TextField
          label='New Username'
          fullWidth
          value={newUsername}
          onChange={e => setNewUsername(e.target.value)}
          sx={{ mb: 2 }}
          required
        />
        <Typography variant='caption'>
          *Enter current password to authorize change.
        </Typography>
        <TextField
          label='Current Password'
          type='password'
          fullWidth
          value={password1}
          onChange={e => setPassword1(e.target.value)}
          sx={{ mb: 3 }}
          required
        />
        <Button type='submit' variant='contained' sx={{ mb: 2 }}>
          Update Username
        </Button>
      </form>

      <Divider sx={{ my: 1 }} />

      {/* Change Password */}
      <form onSubmit={handlePasswordUpdate}>
        <Typography variant='h6'>Change Password</Typography>
        <TextField
          label='New Password'
          type='password'
          fullWidth
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          sx={{ mb: 2 }}
          required
        />
        <TextField
          label='Confirm New Password'
          type='password'
          fullWidth
          value={confirmNewPassword}
          onChange={e => setConfirmNewPassword(e.target.value)}
          sx={{ mb: 2 }}
          required
        />
        <Typography variant='caption'>
          *Enter current password to authorize change.
        </Typography>
        <TextField
          label='Current Password'
          type='password'
          fullWidth
          value={password2}
          onChange={e => setPassword2(e.target.value)}
          sx={{ mb: 3 }}
          required
        />
        <Button type='submit' variant='contained' sx={{ mb: 2 }}>
          Update Password
        </Button>
      </form>

      <Divider sx={{ my: 1 }} />

      {/* Update Preferences */}
      <form onSubmit={handlePreferencesUpdate}>
        <Typography variant='h6'>Update Preferences</Typography>
        <TextField
          label='Preferences'
          multiline
          minRows={3}
          fullWidth
          value={preferences}
          onChange={e => setPreferences(e.target.value)}
          sx={{ mb: 2 }}
          required
        />
        <Button type='submit' variant='contained' sx={{ mb: 2 }}>
          Update Preferences
        </Button>
      </form>

      <Divider sx={{ my: 1, borderColor: 'error.main' }} />

      {/* Delete Account */}
      <form onSubmit={handleAccountDeletion}>
        <Typography variant='h6' color='error' gutterBottom>
          Delete Account
        </Typography>
        <Typography variant='body2' sx={{ mb: 2 }}>
          This will permanently delete your account. This action cannot be
          undone.
        </Typography>
        <TextField
          label='Current Password'
          type='password'
          fullWidth
          value={deletePassword}
          onChange={e => setDeletePassword(e.target.value)}
          sx={{ mb: 3 }}
          required
        />
        <Button type='submit' variant='contained' color='error'>
          Delete My Account
        </Button>
      </form>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
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
    </Box>
  )
}
