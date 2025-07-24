import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

export default function CreateTodoForm () {
  const [title, setTitle] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [description, setDescription] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [intervalDays, setIntervalDays] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const maxNameCharLimit = 64
  const maxDescriptionLimit = 255

  const { project_id } = useParams()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title) {
      setError('Please fill in the todo title')
      return
    }

    if (
      recurring &&
      (!intervalDays || isNaN(intervalDays) || Number(intervalDays) <= 0)
    ) {
      setError('Please enter a valid interval in days for recurring todos')
      return
    }

    setLoading(true)

    try {
      const payload = {
        project_id: Number(project_id),
        name: title,
        description
      }

      if (dateTime) {
        const timestamp = new Date(dateTime).getTime() / 1000
        payload.dueTime = timestamp
      }

      if (recurring) {
        payload.recurring = true
        payload.interval = Number(intervalDays)
      }

      const res = await fetch('/api/todo/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      })

      let data = {}
      try {
        data = await res.json()
      } catch {
        // ignore
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create todo.')
      }

      setSuccess(data.message || 'Todo created successfully!')
      setTimeout(() => navigate(`/projects/project/${project_id}/todos`), 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
        Create New Todo
      </Typography>

      {error && <Alert severity='error'>{error}</Alert>}
      {success && <Alert severity='success'>{success}</Alert>}

      <TextField
        label='Todo Name'
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
        inputProps={{ maxLength: maxNameCharLimit }}
        helperText={`${title.length}/${maxNameCharLimit} characters`}
        error={title.length > maxNameCharLimit}
      />

      <TextField
        label='Date & Time (Optional)'
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
        inputProps={{ min: 0 }}
      />

      <Button variant='contained' type='submit' disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Create Todo'}
      </Button>
    </Box>
  )
}
