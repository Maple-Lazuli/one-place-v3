import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel
} from '@mui/material'

export default function UpdateTodoForm () {
  const { project_id, todo_id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [description, setDescription] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [intervalDays, setIntervalDays] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const maxNameCharLimit = 64
  const maxDescriptionLimit = 255

  const formatLocalDateTime = date => {
    const pad = n => String(n).padStart(2, '0')
    const yyyy = date.getFullYear()
    const MM = pad(date.getMonth() + 1)
    const dd = pad(date.getDate())
    const hh = pad(date.getHours())
    const mm = pad(date.getMinutes())
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
  }

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
        setDescription(todo.description || '')
        setRecurring(!!todo.recurring)
        setIntervalDays(todo.intervalDays?.toString() || '')

        if (todo.dueTime) {
          const dt = new Date(todo.dueTime * 1000)
          setDateTime(formatLocalDateTime(dt))
        } else {
          setDateTime('')
        }
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

    if (
      recurring &&
      (!intervalDays || isNaN(intervalDays) || Number(intervalDays) <= 0)
    ) {
      setError('Please enter a valid interval in days for recurring todos')
      return
    }

    setSubmitLoading(true)

    try {
      const payload = {
        todo_id,
        new_name: title,
        new_description: description,
        recurring
      }

      if (recurring) {
        payload.interval = Number(intervalDays)
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
      setTimeout(() => navigate(`/projects/project/${project_id}/todos`), 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

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
        inputProps={{ maxLength: maxNameCharLimit }}
        helperText={`${title.length}/${maxNameCharLimit} characters`}
        error={title.length > maxNameCharLimit}
      />

      <TextField
        label='Date & Time Due (Optional)'
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
        inputProps={{ maxLength: maxDescriptionLimit }}
        helperText={`${description.length}/${maxDescriptionLimit} characters`}
        error={description.length > maxDescriptionLimit}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={recurring}
            onChange={e => setRecurring(e.target.checked)}
          />
        }
        label='Recurring'
      />

      <TextField
        label='Interval in Days'
        type='number'
        value={intervalDays}
        onChange={e => setIntervalDays(e.target.value)}
        disabled={!recurring}
        inputProps={{ min: 1 }}
      />

      <Button variant='contained' type='submit' disabled={submitLoading}>
        {submitLoading ? <CircularProgress size={24} /> : 'Update Todo'}
      </Button>
    </Box>
  )
}
