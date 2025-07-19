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

export default function PageCard ({
  name,
  page_id,
  onDelete
}) {
  const { project_id } = useParams()


  const handleDelete = async page_id => {
    try {
      const res = await fetch('/api/pages/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // to send the cookie
        body: JSON.stringify({ page_id: page_id })
      })

      const data = await res.json()
      if (data.status === 'success') {
        onDelete?.(page_id) // Notify parent to remove the card
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

        <Stack direction='row' spacing={1}>
          <Button
            variant='outlined'
            component={Link}
            to={`/projects/project/${project_id}/pages/page/${page_id}`}
          >
            Open
          </Button>
          <Button
            variant='outlined'
            component={Link}
            to={`/projects/project/${project_id}/pages/update/${page_id}`}
          >
            Edit
          </Button>
          <Button
            variant='outlined'
            color='error'
            onClick={() => handleDelete(page_id)}
          >
            Delete
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
