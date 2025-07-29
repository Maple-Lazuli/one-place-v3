import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'

export default function UpdateEventForm () {
  const { project_id, event_id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [dateStartTime, setStartTime] = useState('')
  const [dateEndTime, setEndTime] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const theme = useTheme()
  const eventNameLimit = 64
  const eventDescriptionLimit = 255

  function toLocalISODateTime (date) {
    return (
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0') +
      'T' +
      String(date.getHours()).padStart(2, '0') +
      ':' +
      String(date.getMinutes()).padStart(2, '0')
    )
  }

  // Fetch event details on mount
  useEffect(() => {
    async function fetchEvent () {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/events/get?id=${event_id}`, {
          credentials: 'include'
        })
        const data = await res.json()

        if (!res.ok || data.status === 'error') {
          throw new Error(data.message || 'Failed to load event data')
        }

        const event = data.message // from response: { status: 'success', message: event }
        console.log(event)

        setTitle(event.name || '')
        setStartTime(toLocalISODateTime(new Date(event.startTime * 1000)))
        setEndTime(toLocalISODateTime(new Date(event.endTime * 1000)))

        setDescription(event.description || '')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [event_id])

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title || !dateStartTime || !dateEndTime) {
      setError('Please fill in the event title and date/time.')
      return
    }

    setSubmitLoading(true)

    try {
      // const  = new Date(dateTime).getTime() / 1000 // seconds since epoch

      const payload = {
        event_id,
        new_name: title,
        new_description: description,
        new_startTime: new Date(dateStartTime).getTime() / 1000,
        new_endTime: new Date(dateEndTime).getTime() / 1000
      }

      const res = await fetch('/api/events/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      })

      const data = await res.json()

      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || 'Failed to update event.')
      }

      setSuccess(data.message || 'Event updated successfully!')
      setTimeout(() => navigate(`/projects/project/${project_id}/events`), 1500)
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
        Update Event
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

      <Button variant='contained' type='submit' disabled={submitLoading}>
        {submitLoading ? <CircularProgress size={24} /> : 'Update Event'}
      </Button>
    </Box>
  )
}
