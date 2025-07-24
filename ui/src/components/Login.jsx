import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  Link,
} from '@mui/material'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      // console.log(data)
      if (data.status === 'success') {
        navigate('/')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const usernameMaxLength = 25

  return (
    <Box
      maxWidth={400}
      mx="auto"
      mt={8}
      p={4}
      borderRadius={2}
      boxShadow={3}
      component="form"
      onSubmit={handleLogin}
    >
      <Stack spacing={2}>
        <Typography variant="h5" align="center">
          Login
        </Typography>

        <TextField
          label="Username"
          value={username}
          onChange={(e) => {
            if (e.target.value.length <= usernameMaxLength) {
              setUsername(e.target.value)
            }
          }}
          required
          inputProps={{ maxLength: usernameMaxLength }}
          helperText={`${usernameMaxLength - username.length} characters remaining`}
        />

        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button variant="contained" type="submit" fullWidth>
          Login
        </Button>

        {error && <Alert severity="error">{error}</Alert>}

        <Typography variant="body2" align="center">
          Don't have an account?{' '}
          <Link component={RouterLink} to="/register">
            Create one
          </Link>
        </Typography>
      </Stack>
    </Box>
  )
}
