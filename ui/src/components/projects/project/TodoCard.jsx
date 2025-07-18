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

export default function TodoCard ({
  name,
  date,
  description,
  todo_id,
  onDelete,
  isPast = false
}) {
  const { project_id } = useParams()

  const formattedDate = new Date(date * 1000).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const handleDelete = async todo_id => {
    try {
      const res = await fetch('/api/todos/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // to send the cookie
        body: JSON.stringify({ todo_id: todo_id })
      })

      const data = await res.json()
      if (data.status === 'success') {
        onDelete?.(todo_id) // Notify parent to remove the card
      } else {
        console.error(data.message)
      }
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

    const handleComplete = async todo_id => {
    try {
      const res = await fetch('/api/todos/complete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // to send the cookie
        body: JSON.stringify({ todo_id: todo_id })
      })

      const data = await res.json()
      if (data.status === 'success') {
        onDelete?.(todo_id) // Notify parent to remove the card
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
        mb: 2,
        opacity: isPast ? 0.5 : 1
      }}
    >
      <CardContent>
        <Typography variant='h6' gutterBottom>
          {name}
        </Typography>
        <Typography variant='subtitle2' color='text.secondary' gutterBottom>
          {formattedDate}
        </Typography>
        <Box sx={{ whiteSpace: 'pre-line', mb: 2 }}>
          <Typography variant='body2' color='text.primary'>
            {description}
          </Typography>
        </Box>

        <Stack direction='row' spacing={1}>
          <Button
            variant='outlined'
            color='success'
            onClick={() => handleComplete(todo_id)}
          >
            Delete
          </Button>
          <Button
            variant='outlined'
            component={Link}
            to={`/projects/project/${project_id}/todo/update/${todo_id}`}
          >
            Edit
          </Button>
          <Button
            variant='outlined'
            color='error'
            onClick={() => handleDelete(todo_id)}
          >
            Delete
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
