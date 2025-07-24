import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Chip
} from '@mui/material'

import { Link } from 'react-router-dom'

export default function ProjectCard ({
  name,
  description,
  project_id,
  onDelete,
  tags = [], // default to empty array
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
        maxWidth: 400,
        mb: 2,
        border: '2px solid rgba(0, 0, 0, 0.2)',
        borderColor: 'primary.secondary',
        borderRadius: 2,
        boxShadow: 3,
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
        <Typography variant='body2' gutterBottom>
          {description}
        </Typography>

        {/* Tag display */}
        {tags.length > 0 && (
          <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap' mt={1}>
            {tags.map(tag => (
              <Chip
                key={tag.TagID || tag}
                label={tag.tag || "tag"}
                size='small'
                color='primary'
                variant='outlined'
              />
            ))}
          </Stack>
        )}
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
