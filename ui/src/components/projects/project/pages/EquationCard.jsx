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

export default function EquationCard ({
  name,
  description,
  equation_id,
  onDelete,
  passed_page_id = undefined
}) {
  const { project_id, page_id } = useParams()

  const handleDelete = async equation_id => {
    try {
      const res = await fetch('/api/equations/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // to send the cookie
        body: JSON.stringify({ equation_id: equation_id })
      })

      const data = await res.json()
      if (data.status === 'success') {
        onDelete?.(equation_id) // Notify parent to remove the card
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
        boxShadow:3
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

        <Stack direction='row' spacing={1}>
          <Button
            variant='outlined'
            component={Link}
            to={`/projects/project/${project_id}/pages/page/${page_id ? page_id : passed_page_id}/equations/view/${equation_id}`}
          >
            View
          </Button>
          <Button
            variant='outlined'
            component={Link}
            color='warning'
            to={`/projects/project/${project_id}/pages/page/${page_id ? page_id : passed_page_id}/equations/update/${equation_id}`}
          >
            Edit
          </Button>
          <Button
            variant='outlined'
            color='error'
            onClick={() => handleDelete(equation_id)}
          >
            Delete
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
