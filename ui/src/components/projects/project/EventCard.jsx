import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack
} from '@mui/material'
import { Link, useParams } from 'react-router-dom'

export default function EventCard({
  name,
  date,
  dateEnd,
  description,
  event_id,
  onDelete,
  isPast = false,
  borderColor
}) {
  const { project_id } = useParams()

const formattedStartDate = new Date(date * 1000).toLocaleString(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

const formattedEndDate = new Date(dateEnd * 1000).toLocaleString(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})


  const handleDelete = async (event_id) => {
    try {
      const res = await fetch('/api/events/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // to send the cookie
        body: JSON.stringify({ event_id: event_id })
      })

      const data = await res.json()
      if (data.status === 'success') {
        onDelete?.(event_id) // Notify parent to remove the card
      } else {
        console.error(data.message)
      }
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  return (
        <Card
      sx={{
        maxWidth: 400,
        minWidth:200,
        mb: 2,
        opacity: isPast ? 0.5 : 1,
        border: borderColor
          ? `3px solid ${borderColor}`
          : '2px solid rgba(0, 0, 0, 0.2)',
        borderRadius: 2,
        boxShadow: 3
      }}
    >
      <CardContent>
        <Typography variant='h6' gutterBottom>
          {name}
        </Typography>
        <Typography variant='subtitle2' color='text.secondary' gutterBottom>
          {formattedStartDate} - {formattedEndDate}
        </Typography>
        <Box sx={{ whiteSpace: 'pre-line', mb: 2 }}>
          <Typography variant='body2' color='text.primary'>
            {description}
          </Typography>
        </Box>

        <Stack direction='row' spacing={1}>
          <Button
            variant='outlined'
            component={Link}
            color='warning'
            to={`/projects/project/${project_id}/events/update/${event_id}`}
          >
            Edit
          </Button>
          <Button variant='outlined' color='error' onClick={() => handleDelete(event_id)}>
            Delete
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
