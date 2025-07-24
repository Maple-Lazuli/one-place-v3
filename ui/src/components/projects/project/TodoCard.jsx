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
  onComplete,
  isPast = false,
  completedTime,
  borderColor
}) {
  const { project_id } = useParams()

  const formatUnixTime = unix => {
    if (!unix) return 'undefined'
    try {
      return new Date(unix * 1000).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'undefined'
    }
  }

  const formattedDueDate = formatUnixTime(date)
  const formattedCompletedTime = formatUnixTime(completedTime)

  const handleDelete = async todo_id => {
    try {
      const res = await fetch('/api/todo/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ todo_id })
      })
      const data = await res.json()
      if (data.status === 'success') {
        onDelete?.(todo_id)
      } else {
        console.error(data.message)
      }
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const handleComplete = async todo_id => {
    try {
      const res = await fetch('/api/todo/complete', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ todo_id })
      })
      const data = await res.json()
      if (data.status === 'success') {
        onComplete?.(todo_id)
      } else {
        console.error(data.message)
      }
    } catch (err) {
      console.error('Complete failed', err)
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
          Due: {formattedDueDate}
        </Typography>
        {isPast && (
          <Typography variant='subtitle2' color='text.secondary' gutterBottom>
            Completed On: {formattedCompletedTime}
          </Typography>
        )}
        <Box sx={{ whiteSpace: 'pre-line', mb: 2 }}>
          <Typography variant='body2' color='text.primary'>
            {description}
          </Typography>
        </Box>

        <Stack direction='row' spacing={1}>
          {!isPast && (
            <Button
              variant='outlined'
              color='success'
              onClick={() => handleComplete(todo_id)}
            >
              Complete
            </Button>
          )}
          <Button
            variant='outlined'
            component={Link}
            to={`/projects/project/${project_id}/todos/update/${todo_id}`}
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
