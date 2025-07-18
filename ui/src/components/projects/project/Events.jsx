import { useParams, Link } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  Grid
} from '@mui/material'
import { useEffect, useState } from 'react'
import EventCard from './EventCard'

export default function Events() {
  const { project_id } = useParams()
  const [events, setEvents] = useState([])

  useEffect(() => {
    async function fetchEvents() {
      const res = await fetch(`/api/events/get_project_events?project_id=${project_id}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.status === 'success') {
        setEvents(data.message)
      }
    }

    fetchEvents()
  }, [project_id])

  const handleDelete = (deletedId) => {
    setEvents((prev) => prev.filter((event) => event.EventID !== deletedId))
  }

  const now = Date.now() / 1000 // current UNIX timestamp in seconds

  const futureEvents = [...events]
    .filter((e) => e.eventTime > now)
    .sort((a, b) => a.eventTime - b.eventTime)

  const pastEvents = [...events]
    .filter((e) => e.eventTime <= now)
    .sort((a, b) => b.eventTime - a.eventTime)

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

      <Typography variant="h6" gutterBottom>Future Events</Typography>
      <Grid container spacing={2}>
        {futureEvents.map((event) => (
          <Grid key={event.EventID} item xs={12} sm={6} md={4}>
            <EventCard
              name={event.name}
              date={event.eventTime}
              description={event.description}
              event_id={event.EventID}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Past Events</Typography>
      <Grid container spacing={2}>
        {pastEvents.map((event) => (
          <Grid key={event.EventID} item xs={12} sm={6} md={4}>
            <EventCard
              name={event.name}
              date={event.eventTime}
              description={event.description}
              event_id={event.EventID}
              onDelete={handleDelete}
              isPast={true}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
