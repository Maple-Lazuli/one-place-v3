import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material'
import TodoCard from './TodoCard'
import EventCard from './EventCard'

export default function ProjectOverview() {
  const { project_id } = useParams()

  const [lastEditedPage, setLastEditedPage] = useState(null)
  const [todos, setTodos] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true)
      try {
        // 1. Fetch pages
        const pageRes = await fetch(`/api/pages/get_project_pages?id=${project_id}`, { credentials: 'include' })
        const pageData = await pageRes.json()
        if (pageData.status === 'success') {
          const pages = pageData.message
          if (pages.length > 0) {
            const mostRecentPage = pages.reduce((latest, page) => {
              return (!latest || page.lastEdited > latest.lastEdited) ? page : latest
            }, null)
            setLastEditedPage(mostRecentPage)
          }
        }

        // 2. Fetch todos
        const todoRes = await fetch(`/api/todo/get_project_todo?project_id=${project_id}`, { credentials: 'include' })
        const todoData = await todoRes.json()
        if (todoData.status === 'success') {
          const now = Math.floor(Date.now() / 1000)
          const in7Days = now + 7 * 24 * 60 * 60

          const relevantTodos = todoData.message.filter(todo =>
            !todo.completed &&
            todo.dueTime &&
            todo.dueTime <= in7Days
          )
          setTodos(relevantTodos)
        }

        // 3. Fetch events
        const eventRes = await fetch(`/api/events/get_project_events?project_id=${project_id}`, { credentials: 'include' })
        const eventData = await eventRes.json()
        if (eventData.status === 'success') {
          const now = Math.floor(Date.now() / 1000)
          const in7Days = now + 7 * 24 * 60 * 60

          const upcomingEvents = eventData.message.filter(event =>
            event.time &&
            event.time >= now &&
            event.time <= in7Days
          )
          setEvents(upcomingEvents)
        }
      } catch (err) {
        console.error('Error loading project overview:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [project_id])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Project Overview</Typography>

      {/* Last edited page */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Last Edited Page</Typography>
          {lastEditedPage ? (
            <Link to={`/projects/project/${project_id}/pages/edit/${lastEditedPage.PageID}`}>
              {lastEditedPage.name}
            </Link>
          ) : (
            <Typography variant="body2" color="text.secondary">No pages found</Typography>
          )}
        </CardContent>
      </Card>

      {/* Upcoming/Overdue Todos */}
      <Typography variant="h6" sx={{ mb: 1 }}>Upcoming or Overdue Todos</Typography>
      {todos.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No relevant todos</Typography>
      ) : (
        <Grid container spacing={2}>
          {todos.map(todo => (
            <Grid item key={todo.TodoID} xs={12} sm={6} md={4}>
              <TodoCard
                name={todo.name}
                date={todo.dueTime}
                description={todo.description}
                todo_id={todo.TodoID}
                borderColor="orange"
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Events in next 7 days */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>Upcoming Events</Typography>
      {events.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No events in the next 7 days</Typography>
      ) : (
        <Grid container spacing={2}>
          {events.map(event => (
            <Grid item key={event.EventID} xs={12} sm={6} md={4}>
              <EventCard
                name={event.name}
                description={event.description}
                time={event.time}
                event_id={event.EventID}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
