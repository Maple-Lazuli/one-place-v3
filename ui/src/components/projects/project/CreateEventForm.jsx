import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'

export default function CreateEventForm () {
  const [title, setTitle] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { project_id } = useParams()
    const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title || !dateTime) {
      setError('Please fill in the event title and date/time.')
      return
    }

    setLoading(true)

    try {
      const timestamp = new Date(dateTime).getTime() / 1000 // convert to seconds since epoch

      const payload = {
        project_id: Number(project_id), // convert string param to number
        name: title,
        description,
        time: timestamp
      }
      if (duration) {
        payload.duration = parseInt(duration, 10)
      }

      const res = await fetch('/api/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include' // send cookies (token)
      })

      // parse JSON safely
      let data = {}
      try {
        data = await res.json()
      } catch {
        // response might not be JSON, ignore
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create event.')
      }
      navigate(`/projects/project/${project_id}/events`)
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
        Create New Event
      </Typography>

      {error && <Alert severity='error'>{error}</Alert>}
      {success && <Alert severity='success'>{success}</Alert>}

      <TextField
        label='Event Title'
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />

      <TextField
        label='Date & Time'
        type='datetime-local'
        value={dateTime}
        onChange={e => setDateTime(e.target.value)}
        InputLabelProps={{ shrink: true }}
        required
      />

      <TextField
        label='Duration (Minutes) (Optional)'
        type='number'
        inputProps={{ min: 0 }}
        value={duration}
        onChange={e => setDuration(e.target.value)}
      />

      <TextField
        label='Description'
        multiline
        rows={4}
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      <Button variant='contained' type='submit' disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Create Event'}
      </Button>
    </Box>
  )
}
