import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
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
  const [dateStartTime, setStartTime] = useState('')
  const [dateEndTime, setEndTime] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  const eventNameLimit = 64
  const eventDescriptionLimit = 255

  const { project_id } = useParams()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title || !dateStartTime || !dateEndTime) {
      setError('Please fill in the event title and date/time.')
      return
    }

    setLoading(true)

    try {
      // const timestamp = new Date(dateTime).getTime() / 1000 // convert to seconds since epoch

      const payload = {
        project_id: Number(project_id), // convert string param to number
        name: title,
        description,
        startTime: new Date(dateStartTime).getTime() / 1000,
        endTime: new Date(dateEndTime).getTime() / 1000
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
      setSuccess(data.message || 'Event created successfully!')
      setTimeout(() => navigate(`/projects/project/${project_id}/events`), 1000)
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
        inputProps={{ maxLength: eventNameLimit }}
        helperText={`${title.length}/${eventNameLimit} characters`}
        error={title.length > eventNameLimit}
      />

      <TextField
        label='Start Time'
        type='datetime-local'
        value={dateStartTime}
        onChange={e => setStartTime(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{
          input: {
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.background.paper
          },
          '& .MuiInputBase-root': {
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.background.paper
          },
          '& input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
            filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
          }
        }}
      />

      <TextField
        label='End Time'
        type='datetime-local'
        value={dateEndTime}
        onChange={e => setEndTime(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{
          input: {
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.background.paper
          },
          '& .MuiInputBase-root': {
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.background.paper
          },
          '& input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
            filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
          }
        }}
      />

      <TextField
        label='Description'
        multiline
        rows={4}
        value={description}
        onChange={e => setDescription(e.target.value)}
        inputProps={{ maxLength: eventDescriptionLimit }}
        helperText={`${description.length}/${eventDescriptionLimit} characters`}
        error={description.length > eventDescriptionLimit}
      />

      <Button variant='contained' type='submit' disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Create Event'}
      </Button>
    </Box>
  )
}
