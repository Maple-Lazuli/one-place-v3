import { useParams, Link } from 'react-router-dom'
import { Typography, Box, Button, CircularProgress, Alert } from '@mui/material'
import { useEffect, useState } from 'react'
import EventCard from './EventCard'  // adjust path as needed

export default function Events() {
  const { project_id } = useParams()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      setError('')

      try {
        const res = await fetch(`/api/events/get_project_events?project_id=${project_id}`, {
          credentials: 'include', // send cookies with request
        })

        const data = await res.json()

        if (!res.ok || data.status === 'error') {
          throw new Error(data.message || 'Failed to fetch events')
        }

        // The backend returns events in data.message according to your code
        setEvents(data.message || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [project_id])

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Events for Project {project_id}
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Track or create events associated with this project.
      </Typography>

      <Button
        component={Link}
        to={`/projects/project/${project_id}/events/create`}
        variant="contained"
        sx={{ mb: 3 }}
      >
        Create New Event
      </Button>

      {loading && <CircularProgress />}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && events.length === 0 && (
        <Typography>No events found for this project.</Typography>
      )}

      {!loading && !error && events.map((event) => (
        <EventCard
          key={event.id} // assuming your event object has an id field
          name={event.name}
          date={event.time} // your backend returns event_time as 'time', adjust if needed
          description={event.description}
        />
      ))}
    </Box>
  )
}
