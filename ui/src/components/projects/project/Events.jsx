import { useParams, Link } from 'react-router-dom'
import { Typography, Box, Button } from '@mui/material'
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
    setEvents((prev) => prev.filter((event) => event.event_id !== deletedId))
  }

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
        sx={{ mb: 2 }}
      >
        Create New Event
      </Button>

      {events.map((event) => (
        <EventCard
          key={event.event_id}
          name={event.name}
          date={event.date}
          description={event.description}
          event_id={event.event_id}
          onDelete={handleDelete}
        />
      ))}
    </Box>
  )
}
