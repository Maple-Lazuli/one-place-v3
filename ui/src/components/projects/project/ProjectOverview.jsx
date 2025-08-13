import React, { useEffect, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Snackbar,
  Alert,
  Typography,
  Box,
  Grid,
  Divider,
  Card,
  CardContent,
  Link as MUILink,
  CircularProgress
} from '@mui/material'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

import TodoCard from './TodoCard'
import EventCard from './EventCard'

export default function ProjectOverview () {
  const { project_id } = useParams()
  const [reviewData, setReviewData] = useState([])

  const [lastEditedPage, setLastEditedPage] = useState(null)
  const [todos, setTodos] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  useEffect(() => {
    async function fetchAllData () {
      setLoading(true)
      try {
        // 1. Fetch pages
        const pageRes = await fetch(
          `/api/pages/get_project_pages?id=${project_id}`,
          { credentials: 'include' }
        )
        const pageData = await pageRes.json()
        if (pageData.status === 'success') {
          const pages = pageData.message
          if (pages.length > 0) {
            const mostRecentPage = pages.reduce((latest, page) => {
              return !latest || page.lastEditTime > latest.lastEditTime
                ? page
                : latest
            }, null)
            setLastEditedPage(mostRecentPage)
          }
        }

        const reviewRes = await fetch(
          `/api/pages/get_project_pages_review_list?id=${project_id}`,
          { credentials: 'include' }
        )
        const reviewDataJson = await reviewRes.json()
        if (reviewDataJson.status === 'success') {
          setReviewData(reviewDataJson.message)
        }

        // 2. Fetch todos
        const todoRes = await fetch(
          `/api/todo/get_project_todo?project_id=${project_id}`,
          { credentials: 'include' }
        )
        const todoData = await todoRes.json()
        if (todoData.status === 'success') {
          const now = Math.floor(Date.now() / 1000)
          const in7Days = now + 7 * 24 * 60 * 60

          const relevantTodos = todoData.message.filter(
            todo => !todo.completed && todo.dueTime && todo.dueTime <= in7Days
          )
          setTodos(relevantTodos)
        }
        const eventRes = await fetch(
          `/api/events/get_project_events?project_id=${project_id}`,
          { credentials: 'include' }
        )
        const eventData = await eventRes.json()
        if (eventData.status === 'success') {
          const now = Math.floor(Date.now() / 1000)
          const in7Days = now + 7 * 24 * 60 * 60

          const upcomingEvents = eventData.message.filter(
            event =>
              event.eventTime &&
              event.eventTime >= now &&
              event.eventTime <= in7Days
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

  const handleDelete = deletedId => {
    setTodos(prev => prev.filter(todo => todo.TodoID !== deletedId))
  }

  const now = Math.floor(Date.now() / 1000)
  const in24Hours = now + 24 * 60 * 60

  const getBorderColor = dueTime => {
    if (!dueTime) return undefined

    if (dueTime < now) return 'red'
    if (dueTime >= now && dueTime <= in24Hours) return 'orange'

    return undefined
  }

  const handleComplete = async completedTodoId => {
    const now = Math.floor(Date.now() / 1000)
    const in7Days = now + 7 * 24 * 60 * 60

    const completedTodo = todos.find(todo => todo.TodoID === completedTodoId)

    // Mark as completed locally
    setTodos(prevTodos =>
      prevTodos
        .map(todo =>
          todo.TodoID === completedTodoId
            ? {
                ...todo,
                completed: true,
                timeCompleted: now
              }
            : todo
        )
        // Filter to keep only those still incomplete or newly valid recurring ones
        .filter(
          todo => !todo.completed && todo.dueTime && todo.dueTime <= in7Days
        )
    )

    // If recurring, refetch from server to include the next recurrence
    if (completedTodo?.recurring) {
      try {
        const res = await fetch(
          `/api/todo/get_project_todo?project_id=${project_id}`,
          { credentials: 'include' }
        )
        const data = await res.json()
        if (data.status === 'success') {
          const refreshed = data.message.filter(
            todo => !todo.completed && todo.dueTime && todo.dueTime <= in7Days
          )
          setTodos(refreshed)
          setSnackbarOpen(true)
        }
      } catch (err) {
        console.error('Failed to refetch todos after recurring complete:', err)
      }
    }
  }

  const mostStalePage = reviewData.reduce(
    (max, page) => (page.days > (max?.days ?? -1) ? page : max),
    null
  )

  return (
    <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      <Typography variant='h4' gutterBottom>
        Project Overview
      </Typography>

      {lastEditedPage ? (
        <>
          <Typography variant='body' gutterBottom>
            Continue Where You Left Off:{'  '}
            <MUILink
              component={RouterLink}
              to={`/projects/project/${project_id}/pages/page/${lastEditedPage.PageID}/editor`}
              underline='hover'
              variant='body1'
              sx={{ fontWeight: 500 }}
            >
              {lastEditedPage.name}
            </MUILink>
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            (Last edited:{' '}
            {new Date(lastEditedPage.lastEditTime * 1000).toLocaleString()})
          </Typography>
        </>
      ) : (
        <Typography variant='body2' color='text.secondary'>
          No pages found
        </Typography>
      )}

      {reviewData.length === 0 ? (
        <Typography variant='body2' color='text.secondary'>
          No review data available
        </Typography>
      ) : (
        <Box
          sx={{ width: '100%', maxWidth: '100%', overflowY: 'hidden', mb: 3 }}
        >
          <Divider sx={{ my: 2 }}>Days Since Last Review</Divider>

          {mostStalePage && (
            <Box sx={{ mb: 1 }}>
              <Typography variant='body'>
                Most in need of review:{' '}
                <MUILink
                  component={RouterLink}
                  to={`/projects/project/${project_id}/pages/page/${mostStalePage.page_id}/`}
                  underline='hover'
                  sx={{ fontWeight: 500 }}
                >
                  {mostStalePage.name}
                </MUILink>{' '}
                ({mostStalePage.days} day{mostStalePage.days !== 1 ? 's' : ''})
              </Typography>
            </Box>
          )}

          <ResponsiveContainer
            width='100%'
            height={Math.max(200, reviewData.length * 50)}
          >
            <BarChart
              data={[...reviewData].sort((a, b) => b.days - a.days)}
              layout='vertical'
              margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
            >
              <XAxis type='number' />
              <YAxis type='category' dataKey='name' width={150} />
              <Tooltip />
              <Bar
                dataKey='days'
                fill='#1976d2'
                onClick={data => {
                  const pageId = data.page_id
                  if (pageId) {
                    window.location.href = `/projects/project/${project_id}/pages/page/${pageId}/`
                  } 
                }}
              >
                {reviewData.map((entry, index) => {
                  const intensity = Math.min(1, entry.days / 30)
                  const color = `rgba(25, 118, 210, ${0.4 + 0.6 * intensity})`
                  return <Cell key={`cell-${index}`} fill={color} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Upcoming/Overdue Todos */}
      <Divider sx={{ my: 2 }}>Upcomming or Overdue Todos</Divider>
      {todos.length === 0 ? (
        <Typography variant='body2' color='text.secondary'>
          No relevant todos
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {todos.map(todo => (
            <Grid key={todo.TodoID}>
              <TodoCard
                name={todo.name}
                date={todo.dueTime}
                description={todo.description}
                onComplete={handleComplete}
                onDelete={handleDelete}
                recurring={todo.recurring}
                interval={todo.interval}
                todo_id={todo.TodoID}
                borderColor={getBorderColor(todo.dueTime)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Divider sx={{ my: 2 }}>Upcomming Events</Divider>
      {events.length === 0 ? (
        <Typography variant='body2' color='text.secondary'>
          No events in the next 7 days
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {events.map(event => (
            <Grid key={event.EventID}>
              <EventCard
                name={event.name}
                description={event.description}
                date={event.eventTime}
                event_id={event.EventID}
              />
            </Grid>
          ))}
        </Grid>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity='success'
          sx={{ width: '100%' }}
        >
          New recurring todo created!
        </Alert>
      </Snackbar>
    </Box>
  )
}
