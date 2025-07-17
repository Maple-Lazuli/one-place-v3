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

export default function UpdateEventForm() {
  const { project_id, event_id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch event details on mount
  useEffect(() => {
    async function fetchEvent() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/events/get_event?project_id=${project_id}&event_id=${event_id}`, {
          credentials: 'include',
        })
        const data = await res.json()

        if (!res.ok || data.status === 'error') {
          throw new Error(data.message || 'Failed to load event data')
        }

        const event = data.message // Adjust based on your API response structure

        setTitle(event.name)
        // Format datetime-local input value: "YYYY-MM-DDTHH:mm"
        const dt = new Date(event.time)
        const localISO = dt.toISOString().slice(0,16)
        setDateTime(localISO)

        setDescription(event.description || '')
        setDuration(event.duration?.toString() || '')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [project_id, event_id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title || !dateTime) {
      setError('Please fill in the event title and date/time.')
      return
    }

    setSubmitLoading(true)

    try {
      const timestamp = new Date(dateTime).getTime() / 1000 // seconds since epoch

      const payload = {
        project_id,
        event_id,
        name: title,
        description,
        time: timestamp,
      }

      if (duration) {
        payload.duration = parseInt(duration, 10)
      }

      const res = await fetch('/api/events/update', {
        method: 'POST', // or PUT depending on your API
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || 'Failed to update event.')
      }

      setSuccess(data.message || 'Event updated successfully!')
      // Optionally redirect to events list or project page after a delay
      setTimeout(() => navigate(`/projects/project/${project_id}/events`), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) return <CircularProgress />

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 400,
        mx: 'auto',
        mt: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Update Event
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <TextField
        label="Event Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <TextField
        label="Date & Time"
        type="datetime-local"
        value={dateTime}
        onChange={(e) => setDateTime(e.target.value)}
        InputLabelProps={{ shrink: true }}
        required
      />

      <TextField
        label="Duration (minutes)"
        type="number"
        inputProps={{ min: 0 }}
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
      />

      <TextField
        label="Description"
        multiline
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Button variant="contained" type="submit" disabled={submitLoading}>
        {submitLoading ? <CircularProgress size={24} /> : 'Update Event'}
      </Button>
    </Box>
  )
}
