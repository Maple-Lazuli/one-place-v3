import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'

export default function UpdateTodoForm () {
  const { project_id, todo_id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const formatLocalDateTime = date => {
    const pad = n => String(n).padStart(2, '0')
    const yyyy = date.getFullYear()
    const MM = pad(date.getMonth() + 1)
    const dd = pad(date.getDate())
    const hh = pad(date.getHours())
    const mm = pad(date.getMinutes())
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
  }

  // Fetch todo details on mount
  useEffect(() => {
    async function fetchTodo () {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/todo/get?id=${todo_id}`, {
          credentials: 'include'
        })
        const data = await res.json()

        if (!res.ok || data.status === 'error') {
          throw new Error(data.message || 'Failed to load todo data')
        }

        const todo = data.message

        setTitle(todo.name || '')

        if (todo.dueTime) {
          const dt = new Date(todo.dueTime * 1000)
          setDateTime(formatLocalDateTime(dt))
        } else {
          setDateTime('')
        }

        setDescription(todo.description || '')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTodo()
  }, [todo_id])

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title) {
      setError('Please fill in the Todo title')
      return
    }

    setSubmitLoading(true)

    try {
      const payload = {
        todo_id: todo_id,
        new_name: title,
        new_description: description
      }
      if (dateTime) {
        const timestamp = new Date(dateTime).getTime() / 1000
        payload.dueTime = timestamp
      }

      const res = await fetch('/api/todo/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      })

      const data = await res.json()

      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || 'Failed to update todo.')
      }

      setSuccess(data.message || 'Todo updated successfully!')
      setTimeout(() => navigate(`/projects/project/${project_id}/todos`), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )

  return (
    <Box
      component='form'
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 400,
        mx: 'auto',
        mt: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
    >
      <Typography variant='h5' component='h2' gutterBottom>
        Update Todo
      </Typography>

      {error && <Alert severity='error'>{error}</Alert>}
      {success && <Alert severity='success'>{success}</Alert>}

      <TextField
        label='Todo Title'
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />

      <TextField
        label='Date & Time Due (Optional'
        type='datetime-local'
        value={dateTime}
        onChange={e => setDateTime(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        label='Description'
        multiline
        rows={4}
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      <Button variant='contained' type='submit' disabled={submitLoading}>
        {submitLoading ? <CircularProgress size={24} /> : 'Update Todo'}
      </Button>
    </Box>
  )
}
