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
      project_id: Number(project_id)
    }

    try {
      const res = await fetch('/api/projects/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.status === 'success') {
        onDelete?.(project_id)
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
        justifyContent: 'space-between',
        ...sx
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant='h6' gutterBottom>
          {name}
        </Typography>
        <Typography variant='body2'>{description}</Typography>
      </CardContent>

      <Box sx={{ width: '100%', px: 2, pb: 2 }}>
        <Stack
          direction='row'
          spacing={2}
          justifyContent='space-between'
          sx={{ width: '100%' }}
        >
          <Button
            fullWidth
            sx={{ flex: 1 }}
            variant='outlined'
            component={Link}
            to={`/projects/project/${project_id}`}
          >
            Open
          </Button>
          <Button
            fullWidth
            sx={{ flex: 1 }}
            variant='outlined'
            component={Link}
            color='warning'
            to={`/projects/project/${project_id}/update`}
          >
            Edit
          </Button>
          <Button
            fullWidth
            sx={{ flex: 1 }}
            variant='outlined'
            color='error'
            onClick={() => handleDelete(project_id)}
          >
            Delete
          </Button>
        </Stack>
      </Box>
    </Card>
  )
}
