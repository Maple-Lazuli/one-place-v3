import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack
} from '@mui/material'
import { Link, useParams } from 'react-router-dom'

export default function PageCard ({
  name,
  page_id,
  last_edit,
  onDelete
}) {
  const { project_id } = useParams()

  const handleDelete = async (page_id) => {
    try {
      const res = await fetch('/api/pages/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ page_id })
      })

      const data = await res.json()
      if (data.status === 'success') {
        onDelete?.(page_id)
      } else {
        console.error(data.message)
      }
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const formatDate = (unixTimestamp) => {
    const timestamp = unixTimestamp > 1e12 ? unixTimestamp : unixTimestamp * 1000
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <Card sx={{ maxWidth: 400, mb: 2 }}>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          {name}
        </Typography>

        {last_edit && (
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            Last Edited: {formatDate(last_edit)}
          </Typography>
        )}

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
            color='warning'
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
