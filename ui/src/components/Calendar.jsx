import React, { useState, useEffect, useCallback } from 'react'
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
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

// Color coding by type
const typeColors = {
  project: '#1976d2',
  page: '#388e3c',
  code: '#f57c00',
  translation: '#6a1b9a',
  equation: '#d32f2f',
  canvas: '#0288d1',
  files: '#5d4037'
}

const allTypes = Object.keys(typeColors)


export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState(() =>
    allTypes.reduce((acc, type) => ({ ...acc, [type]: true }), {})
  );
  const [view, setView] = useState(Views.MONTH);
  const [dateRange, setDateRange] = useState([null, null]); // store visible start and end dates

  // Helper: format Date object to unix timestamp in seconds
  const toUnixSeconds = (date) => Math.floor(date.getTime() / 1000);

  // Fetch events whenever dateRange or view changes
  const fetchEvents = useCallback(async () => {
    if (!dateRange[0] || !dateRange[1]) return;

    // Convert to unix timestamps
    const start = toUnixSeconds(dateRange[0]);
    const end = toUnixSeconds(dateRange[1]);

    // Compose fetch URL
    // You can add a param to specify summary or detailed mode if needed
    const summary = (view === Views.MONTH) ? 'true' : 'false';

    const res = await fetch(`/api/logging/get_user_history?start=${start}&end=${end}&summary=${summary}`);
    const data = await res.json();

    if (data.status === 'success') {
      const formatted = data.message.map(entry => ({
        title: `${entry.event === 'CREATE' ? 'Created' : 'Updated'} ${entry.name}`,
        start: new Date(entry.time * 1000),
        end: new Date(entry.time * 1000),
        type: entry.type,
      }));
      setEvents(formatted);
    }
  }, [dateRange, view]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Called when calendar visible range changes
  // Range param depends on view:
  // - For month view, it's an array of dates (all days visible in month)
  // - For week/day view, it's { start: Date, end: Date }
  const handleRangeChange = (range) => {
    let start, end;
    if (Array.isArray(range)) {
      // month view - range is array of dates
      start = range[0];
      end = range[range.length - 1];
    } else if (range.start && range.end) {
      // week/day view - range is object with start and end
      start = range.start;
      end = range.end;
    } else {
      // fallback (shouldn't happen)
      start = null;
      end = null;
    }
    setDateRange([start, end]);
  };

  // rest unchanged...

  const handleFilterChange = (type) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const filteredEvents = events.filter(event => filters[event.type]);

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
      <Paper elevation={3} sx={{ width: 250, p: 2, borderRadius: 0 }}>
        <Typography variant="h6" gutterBottom>My Filters</Typography>
        <Divider sx={{ mb: 2 }} />
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
                    '&.Mui-checked': { color: typeColors[type] },
                  }}
                />
              }
              label={type.charAt(0).toUpperCase() + type.slice(1)}
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
          onRangeChange={handleRangeChange} // key: update date range on range change
        />
      </Box>
    </Box>
  );
}
