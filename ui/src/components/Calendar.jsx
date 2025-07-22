import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const typeColors = {
  project: '#1976d2',
  page: '#388e3c',
  code: '#f57c00',
  translation: '#6a1b9a',
  equation: '#d32f2f',
  canvas: '#0288d1',
  files: '#5d4037',
};

const allTypes = Object.keys(typeColors);
const logTypes = ['CREATE', 'DELETE', 'UPDATE', 'UPLOAD'];

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState(() =>
    allTypes.reduce((acc, type) => ({ ...acc, [type]: true }), {})
  );
  const [logFilters, setLogFilters] = useState(() =>
    logTypes.reduce((acc, type) => ({ ...acc, [type]: true }), {})
  );
  const [view, setView] = useState(Views.MONTH);
  const today = new Date();
  const initialStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const initialEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  const [dateRange, setDateRange] = useState([initialStart, initialEnd]);

  // Helper: convert Date to unix seconds
  const toUnixSeconds = (date) => Math.floor(date.getTime() / 1000);

  const fetchEvents = useCallback(async () => {
    if (!dateRange[0] || !dateRange[1]) return;

    const start = toUnixSeconds(dateRange[0]);
    const end = toUnixSeconds(dateRange[1]);

    const summary = view === Views.MONTH ? 'true' : 'false';

    try {
      const res = await fetch(
        `/api/logging/get_user_history?start=${start}&end=${end}&summary=${summary}`
      );
      const data = await res.json();

      if (data.status === 'success') {
        const formatted = data.message.map((entry) => ({
          title: `${entry.event === 'CREATE' ? 'Created' : entry.event === 'DELETE' ? 'Deleted' : entry.event === 'UPLOAD' ? 'Uploaded' : 'Updated'} ${entry.name}`,
          start: new Date(entry.time * 1000),
          end: new Date(entry.time * 1000),
          type: entry.type,
          eventType: entry.event,
        }));
        setEvents(formatted);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }, [dateRange, view]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRangeChange = (range) => {
    let start, end;
    if (Array.isArray(range)) {
      // Month view gives an array of dates
      start = range[0];
      end = range[range.length - 1];
    } else if (range.start && range.end) {
      // Week/day view gives object with start/end
      start = range.start;
      end = range.end;
    } else {
      start = null;
      end = null;
    }
    setDateRange([start, end]);
  };

  const handleFilterChange = (type) => {
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleLogFilterChange = (logType) => {
    setLogFilters((prev) => ({ ...prev, [logType]: !prev[logType] }));
  };

  // Filter events by both content type and log event type
  const filteredEvents = events.filter(
    (event) => filters[event.type] && logFilters[event.eventType]
  );

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: typeColors[event.type] || '#607d8b',
      borderRadius: '4px',
      color: 'white',
      border: 'none',
      padding: '4px',
    },
  });

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Paper elevation={3} sx={{ width: 280, p: 2, borderRadius: 0, overflowY: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          My Filters
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle1" sx={{ mt: 1 }}>
          Content Types
        </Typography>
        <Stack spacing={1}>
          {allTypes.map((type) => (
            <FormControlLabel
              key={type}
              control={
                <Checkbox
                  checked={filters[type]}
                  onChange={() => handleFilterChange(type)}
                  sx={{
                    color: typeColors[type],
                    '&.Mui-checked': { color: typeColors[type] },
                  }}
                />
              }
              label={type.charAt(0).toUpperCase() + type.slice(1)}
            />
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Log Event Types
        </Typography>
        <Stack spacing={1}>
          {logTypes.map((logType) => (
            <FormControlLabel
              key={logType}
              control={
                <Checkbox
                  checked={logFilters[logType]}
                  onChange={() => handleLogFilterChange(logType)}
                  sx={{
                    color: '#555',
                    '&.Mui-checked': { color: '#1976d2' },
                  }}
                />
              }
              label={logType.charAt(0).toUpperCase() + logType.slice(1).toLowerCase()}
            />
          ))}
        </Stack>
      </Paper>

      <Box sx={{ flexGrow: 1, p: 2, height: '100%' }}>
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          onRangeChange={handleRangeChange}
        />
      </Box>
    </Box>
  );
}
