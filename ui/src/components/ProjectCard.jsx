import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack
} from '@mui/material'

import { Link } from 'react-router-dom'

export default function ProjectCard ({
  name,
  description,
  project_id,
  onDelete,
  sx
}) {
  const handleDelete = async project_id => {
    const payload = {
      project_id: Number(project_id) // convert string param to number
    }

    try {
      const res = await fetch('/api/projects/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // to send the cookie
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.status === 'success') {
        onDelete?.(project_id) // Notify parent to remove the card
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
        width: 400,
        height: 200,
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        ...sx
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant='h6' gutterBottom>
          {name}
        </Typography>
        <Typography variant='body2'>{description}</Typography>
        <Stack direction='row' spacing={2}>
          <Button
            variant='outlined'
            component={Link}
            to={`/projects/project/${project_id}`}
          >
            Open
          </Button>
          <Button
            variant='outlined'
            component={Link}
            color='warning'
            to={`/projects/project/${project_id}/`}
          >
            Edit
          </Button>
          <Button
            variant='outlined'
            color='error'
            onClick={() => handleDelete(project_id)}
          >
            Delete
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
