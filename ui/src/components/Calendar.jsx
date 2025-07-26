import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  Paper,
  Stack,
  Divider
} from '@mui/material'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import Cookies from 'js-cookie';
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './Calendar.css'
const localizer = momentLocalizer(moment)

const typeColors = {
  project: '#1976d2',
  page: '#388e3c',
  code: '#f57c00',
  translation: '#6a1b9a',
  equation: '#d32f2f',
  canvas: '#0288d1',
  files: '#5d4037',
  event: '#007BFF',
  'Scheduled Todo': '#fbc12dd2',
  'Completed Todo': '#fbc12d7c'
}

const toUnixSecondsUTC = date => {
  const timezoneOffsetSeconds = date.getTimezoneOffset() * 60 // offset from local time to UTC in seconds
  const utcUnixTime = Math.floor(
    (date.getTime() + timezoneOffsetSeconds * 1000) / 1000
  )
  return utcUnixTime
}

if (Cookies.get('preferences') == 'dark'){
  import('./Calendar_dark.css');
}


const allTypes = Object.keys(typeColors)
const logTypes = ['CREATE', 'DELETE', 'UPDATE', 'UPLOAD', 'REVIEW']

// Custom Event component to hide time text on week/day views
function EventComponent ({ event, title, view }) {


  if (view === Views.WEEK || view === Views.DAY) {
    return (
      <div
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
        title={title}
      >
        {title}
      </div>
    )
  }
  // For month view or others, show title normally
  return <div title={title}>{title}</div>
}
function fromUTCToLocalDate (utcDate) {
  // utcDate can be a string or a Date object
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate

  // Get the local timezone offset in minutes and convert to ms
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000

  // Subtract the offset to shift from UTC to local
  return new Date(date.getTime() - timezoneOffsetMs)
}
// Summarize multiple events on same day/type/name into a single summary event
function summarizeEvents (events) {
  const grouped = {}

  events.forEach(evt => {
    // Group by date string + type + name
    const day = evt.start.toISOString().slice(0, 10)
    const key = `${day}|${evt.type}|${evt.name}`

    if (!grouped[key]) {
      grouped[key] = {
        start: evt.start,
        end: evt.end,
        type: evt.type,
        name: evt.name,
        eventCounts: { CREATE: 0, DELETE: 0, UPDATE: 0, UPLOAD: 0, REVIEW: 0 }
      }
    }
    if (grouped[key].eventCounts[evt.eventType] !== undefined) {
      grouped[key].eventCounts[evt.eventType]++
    } else {
      // count any unknown event type generically as 'UPDATE'
      grouped[key].eventCounts.UPDATE++
    }
  })

  // Now convert grouped into summary events with a combined title
  return Object.values(grouped).map(
    ({ eventCounts, type, name, start, end }) => {
      const parts = []
      if (eventCounts.CREATE)
        parts.push(
          `${eventCounts.CREATE} creation${eventCounts.CREATE > 1 ? 's' : ''}`
        )
      if (eventCounts.UPDATE)
        parts.push(
          `${eventCounts.UPDATE} update${eventCounts.UPDATE > 1 ? 's' : ''}`
        )
      if (eventCounts.DELETE)
        parts.push(
          `${eventCounts.DELETE} deletion${eventCounts.DELETE > 1 ? 's' : ''}`
        )
      if (eventCounts.UPLOAD)
        parts.push(
          `${eventCounts.UPLOAD} upload${eventCounts.UPLOAD > 1 ? 's' : ''}`
        )
      if (eventCounts.REVIEW)
        parts.push(
          `${eventCounts.REVIEW} review${eventCounts.REVIEW > 1 ? 's' : ''}`
        )

      const actionSummary = parts.length > 0 ? parts.join(', ') : 'changes'

      return {
        title: `${actionSummary} to ${
          type.charAt(0).toUpperCase() + type.slice(1)
        }: ${name}`,
        start,
        end,
        type,
        eventType: 'SUMMARY',
        isSummary: true
      }
    }
  )
}

export default function CalendarView ({
  logs_route,
  userEvents_route,
  todo_route,
  currentDate,
  setCurrentDate
}) {
  const today = new Date()
  const initialStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const initialEnd = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  )

  const [events, setEvents] = useState([])
  const [filters, setFilters] = useState(() =>
    allTypes.reduce((acc, type) => ({ ...acc, [type]: true }), {})
  )
  const [logFilters, setLogFilters] = useState(() =>
    logTypes.reduce((acc, type) => ({ ...acc, [type]: true }), {})
  )
  const [view, setView] = useState(Views.MONTH)
  const [dateRange, setDateRange] = useState([initialStart, initialEnd])

  const toUnixSeconds = date => Math.floor(date.getTime() / 1000)

  const fetchEvents = useCallback(async () => {
    if (!dateRange[0] || !dateRange[1]) return

    const start = toUnixSecondsUTC(dateRange[0])
    const end =
      dateRange[0] === dateRange[1]
        ? toUnixSecondsUTC(
            new Date(dateRange[0].getTime() + 24 * 60 * 60 * 1000 - 1)
          )
        : toUnixSecondsUTC(dateRange[1])

    try {
      const [logRes, userEventRes, todoRes] = await Promise.all([
        fetch(`${logs_route}start=${start}&end=${end}&summary=false`),
        fetch(`${userEvents_route}start=${start}&end=${end}`),
        fetch(`${todo_route}start=${start}&end=${end}`)
      ])

      const logData = await logRes.json()
      const userEventData = await userEventRes.json()
      const todoData = await todoRes.json()

      const logEvents =
        logData.status === 'success'
          ? logData.message.map(entry => ({
              title: `${
                entry.event === 'CREATE'
                  ? 'Created'
                  : entry.event === 'DELETE'
                  ? 'Deleted'
                  : entry.event === 'UPLOAD'
                  ? 'Uploaded'
                  : entry.event === 'REVIEW'
                  ? 'Reviewed'
                  : 'Updated'
              } ${entry.name}`,
              start: fromUTCToLocalDate(new Date(entry.time * 1000)),
              end: fromUTCToLocalDate(new Date(entry.time * 1000)),
              type: entry.type,
              eventType: entry.event,
              name: entry.name,
              source: 'log'
            }))
          : []

      const userEvents =
        userEventData.status === 'success'
          ? userEventData.message.map(e => ({
              title: e.name,
              start: fromUTCToLocalDate(new Date(e.eventTime * 1000)),
              end: fromUTCToLocalDate(new Date((e.eventTime + 3600) * 1000)), // 1hr default
              description: e.description,
              type: 'event',
              eventType: 'event',
              name: e.name,
              source: 'userEvent'
            }))
          : []

      const todoEvents =
        todoData.status === 'success'
          ? todoData.message
              .filter(e => (e.completed ? e.timeCompleted : e.dueTime))
              .map(e => {
                const timestamp = e.completed ? e.timeCompleted : e.dueTime
                const label = e.completed ? 'Completed TODO' : 'Due TODO'
                return {
                  title: `${label}: ${e.name}`,
                  start: fromUTCToLocalDate(new Date(timestamp * 1000)),
                  end: fromUTCToLocalDate(new Date((timestamp + 1800) * 1000)), // 30 mins
                  type: e.completed? 'Completed Todo':'Scheduled Todo',
                  eventType: e.completed ? 'COMPLETED' : 'DUE',
                  completed: e.completed,
                  name: e.name,
                  description: e.description,
                  source: 'todo'
                }
              })
          : []

      // Summarize logs only
      let processedLogs = logEvents
      if (view === Views.MONTH) {
        processedLogs = summarizeEvents(logEvents)
      } else if (view === Views.WEEK || view === Views.DAY) {
        processedLogs = summarizeDayViewEvents(logEvents)
      }

      setEvents([...logEvents, ...userEvents, ...todoEvents])
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }, [dateRange, view])

  const filteredLogEvents = useMemo(() => {
    return events.filter(event => {
      if (event.source !== 'log') return false
      const typeMatch = filters[event.type]
      const logMatch =
        event.eventType === 'SUMMARY' || logFilters[event.eventType]
      return typeMatch && logMatch
    })
  }, [events, filters, logFilters])

  const nonLogEvents = useMemo(() => {
    return events.filter(event => event.source !== 'log' && filters[event.type])
  }, [events, filters])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleRangeChange = range => {
    let start, end
    if (Array.isArray(range)) {
      start = range[0]
      end = range[range.length - 1]
    } else if (range.start && range.end) {
      start = range.start
      end = range.end
    } else {
      start = null
      end = null
    }
    setDateRange([start, end])
  }

  const handleFilterChange = type => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }))
  }

  const handleLogFilterChange = logType => {
    setLogFilters(prev => ({ ...prev, [logType]: !prev[logType] }))
  }

  const eventStyleGetter = event => {
    const baseStyle = {
      backgroundColor: typeColors[event.type] || '#607d8b',
      borderRadius: '4px',
      color: 'white',
      border: 'none',
      padding: view === Views.MONTH ? '4px' : '2px 4px',
      fontSize: view === Views.MONTH ? '0.875rem' : '0.75rem',
      whiteSpace: view === Views.MONTH ? 'normal' : 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontStyle: event.isSummary ? 'italic' : 'normal',
      opacity: event.isSummary ? 0.85 : 1
    }
    return { style: baseStyle }
  }

  function summarizeDayViewEvents (events) {
    const grouped = {}

    events.forEach(event => {
      const dayKey = new Date(event.start)
      dayKey.setHours(0, 0, 0, 0)

      const key = `${event.type || ''}-${event.name || ''}-${
        event.event || ''
      }-${dayKey.toISOString()}`

      if (!grouped[key]) {
        grouped[key] = {
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }
      } else {
        if (new Date(event.start) < grouped[key].start) {
          grouped[key].start = new Date(event.start)
        }
        if (new Date(event.end) > grouped[key].end) {
          grouped[key].end = new Date(event.end)
        }
      }
    })

    return Object.values(grouped).map(event => {
      let start = new Date(event.start)
      let end = new Date(event.end)

      if (start.getTime() === end.getTime()) {
        end = new Date(end.getTime() + 5 * 60 * 1000) // add 5 minutes
      }

      return {
        ...event,
        start,
        end,
        title: `${capitalize(event.eventType)}: ${
          event.name || ''
        }`.trim()
      }
    })
  }

  function capitalize (word) {
    if (!word || typeof word !== 'string') return ''
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }

const summarizedLogEvents = useMemo(() => {
  if (view === 'week' || view === 'day') {
    return summarizeDayViewEvents(filteredLogEvents)
  } else {
    return summarizeEvents(filteredLogEvents)
  }
}, [filteredLogEvents, view])

const summarizedEvents = useMemo(() => {
  return [...nonLogEvents, ...summarizedLogEvents]
}, [nonLogEvents, summarizedLogEvents])

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        width: '100vw',
      }}
    >
      <Paper
        elevation={3}
        sx={{ width: 280, p: 2, borderRadius: 0, overflowY: 'auto' }}
      >
        <Typography variant='h6' gutterBottom>
          My Filters
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Typography variant='subtitle1' sx={{ mt: 1 }}>
          Content Types
        </Typography>
        <Stack spacing={1}>
          {allTypes.map(type => (
            <FormControlLabel
              key={type}
              control={
                <Checkbox
                  checked={filters[type]}
                  onChange={() => handleFilterChange(type)}
                  sx={{
                    color: typeColors[type],
                    '&.Mui-checked': { color: typeColors[type] }
                  }}
                />
              }
              label={type.charAt(0).toUpperCase() + type.slice(1)}
            />
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant='subtitle1' gutterBottom>
          Log Types
        </Typography>
        <Stack spacing={1}>
          {logTypes.map(logType => (
            <FormControlLabel
              key={logType}
              control={
                <Checkbox
                  checked={logFilters[logType]}
                  onChange={() => handleLogFilterChange(logType)}
                  sx={{
                    color: '#555',
                    '&.Mui-checked': { color: '#1976d2' }
                  }}
                />
              }
              label={
                logType.charAt(0).toUpperCase() + logType.slice(1).toLowerCase()
              }
            />
          ))}
        </Stack>
      </Paper>

      <Box sx={{ flexGrow: 1, p: 2, height: '100%' }}>
        <Calendar
          localizer={localizer}
          events={summarizedEvents}
          startAccessor='start'
          endAccessor='end'
          view={view}
          onView={setView}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          style={{ height: '100%', padding: '10px' }}
          eventPropGetter={eventStyleGetter}
          onRangeChange={handleRangeChange}
          date={currentDate} 
          onNavigate={setCurrentDate} 
          components={{
            event: props => <EventComponent {...props} view={view} />
          }}
          showMultiDayTimes={view !== Views.MONTH}
          max={3}
          popup
        />
      </Box>
    </Box>
  )
}
