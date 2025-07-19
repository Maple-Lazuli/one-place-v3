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

export default function TranslationCard ({
  language,
  translation_id,
  onDelete
}) {
  const { project_id, page_id } = useParams()

  const handleDelete = async translation_id => {
    try {
      const res = await fetch('/api/translations/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // to send the cookie
        body: JSON.stringify({ translation_id: translation_id })
      })

      const data = await res.json()
      if (data.status === 'success') {
        onDelete?.(translation_id) // Notify parent to remove the card
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
        mb: 2
      }}
    >
      <CardContent>
        <Typography variant='h6' gutterBottom>
          {language}
        </Typography>

        <Stack direction='row' spacing={1}>
          <Button
            variant='outlined'
            component={Link}
            to={`/projects/project/${project_id}/pages/page/${page_id}/translations/update/${translation_id}`}
          >
            Continue
          </Button>
          <Button
            variant='outlined'
            color='error'
            onClick={() => handleDelete(translation_id)}
          >
            Delete
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
