import { useParams, Link } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  Divider,
  Grid
} from '@mui/material'
import { useEffect, useState } from 'react'
import EventCard from './EventCard'

export default function Events() {
  const { project_id } = useParams()
  const [events, setEvents] = useState([])

  useEffect(() => {
    let intervalId
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

    intervalId = setInterval(fetchEvents, 5000)

    return () => clearInterval(intervalId)
  }, [project_id])

  const handleDelete = (deletedId) => {
    setEvents((prev) => prev.filter((event) => event.EventID !== deletedId))
  }

  const now = Date.now() / 1000 // current UNIX timestamp in seconds
  const in24Hours = now + 24 * 60 * 60

  const getBorderColor = (startTime) => {
  if (!startTime) return undefined 

  if (startTime >= now && startTime <= in24Hours) return 'orange' 

  return undefined 
}

  const futureEvents = [...events]
    .filter((e) => e.startTime > now)
    .sort((a, b) => a.startTime - b.startTime)

  const pastEvents = [...events]
    .filter((e) => e.startTime <= now)
    .sort((a, b) => b.startTime - a.startTime)

  return (
    <Box sx={{ p: 2, height: '100%', overflowY:'auto' }}>
      <Typography variant="h5" gutterBottom>
        Events
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

      <Divider sx={{ my: 2 }}>Future Events</Divider>
      <Grid container spacing={2}>
        {futureEvents.map((event) => (
          <Grid key={event.EventID}>
            <EventCard
              name={event.name}
              date={event.startTime}
              dateEnd={event.endTime}
              description={event.description}
              event_id={event.EventID}
              onDelete={handleDelete}
              borderColor={getBorderColor(event.startTime)} 
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 2 }}>Past Events</Divider>
      <Grid container spacing={2}>
        {pastEvents.map((event) => (
          <Grid key={event.EventID}>
            <EventCard
              name={event.name}
              date={event.startTime}
              dateEnd={event.endTime}
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
