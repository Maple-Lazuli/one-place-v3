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

export default function SnippetCard ({
  name,
  language,
  description,
  code_id,
  onDelete
}) {
  const { project_id, page_id } = useParams()

  const handleDelete = async code_id => {
    try {
      const res = await fetch('/api/code_snippet/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // to send the cookie
        body: JSON.stringify({ snippet_id: code_id })
      })

      const data = await res.json()
      if (data.status === 'success') {
        onDelete?.(code_id) // Notify parent to remove the card
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
      }}
    >
      <CardContent>
        <Typography variant='h6' gutterBottom>
          {name}
        </Typography>
        <Typography variant='subtitle2' color='text.secondary' gutterBottom>
          {language}
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
            to={`/projects/project/${project_id}/pages/page/${page_id}/snippets/view/${code_id}`}
          >
            View
          </Button>
          <Button
            variant='outlined'
            component={Link}
            to={`/projects/project/${project_id}/pages/page/${page_id}/snippets/update/${code_id}`}
          >
            Edit
          </Button>
          <Button
            variant='outlined'
            color='error'
            onClick={() => handleDelete(code_id)}
          >
            Delete
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
