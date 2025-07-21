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

export default function CanvasCard ({
  name,
  description,
  canvas_id,
  updated,
  onDelete
}) {
  const { project_id, page_id } = useParams()
  const [showOverlay, setShowOverlay] = React.useState(false)
  const handleDelete = async canvas_id => {
    try {
      const res = await fetch('/api/canvas/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // to send the cookie
        body: JSON.stringify({ canvas_id: canvas_id })
      })

      const data = await res.json()
      if (data.status === 'success') {
        onDelete?.(canvas_id) // Notify parent to remove the card
      } else {
        console.error(data.message)
      }
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const readableDate = new Date(
    updated > 1e12 ? updated : updated * 1000
  ).toLocaleDateString()

  return (
    <Card
      sx={{
        maxWidth: 400,
        mb: 2
      }}
    >
      <CardContent>
        <Typography variant='h6' gutterBottom>
          {name}
        </Typography>
        <Box sx={{ whiteSpace: 'pre-line', mb: 2 }}>
          <Typography variant='body2' color='text.primary'>
            {description}
          </Typography>
        </Box>
        <Typography variant='caption' color='text.secondary' gutterBottom>
          Updated on: {readableDate}
        </Typography>

        <Stack direction='row' spacing={1}>
          <Button
            variant='outlined'
            component={Link}
            to={`/projects/project/${project_id}/pages/page/${page_id}/canvases/update/${canvas_id}`}
          >
            Draw
          </Button>
          <Button
            variant='outlined'
            component={Link}
            to={`/projects/project/${project_id}/pages/page/${page_id}/canvases/update_fields/${canvas_id}`}
          >
            Fix
          </Button>
          <Button
            variant='outlined'
            color='error'
            onClick={() => handleDelete(canvas_id)}
          >
            Delete
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
