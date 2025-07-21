import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login () {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin (e) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // allow cookies
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.status === 'success') {
        // Cookies.set('username_temp', username, {
        //   expires: 7,
        //   path: '/',
        //   sameSite: 'Strict'
        // })
        navigate('/Home')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  return (
    <div className='container'>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          placeholder='Username'
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type='password'
          placeholder='Password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type='submit'>Login</button>
      </form>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <p>
        Don't have an account? <a href='/register'>Create one</a>
      </p>
    </div>
  )
}
