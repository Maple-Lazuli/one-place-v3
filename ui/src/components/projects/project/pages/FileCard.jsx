import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack
} from '@mui/material'
import { useParams } from 'react-router-dom'

export default function FileCard ({
  name,
  description,
  filename,
  upload_date,
  file_id,
  onDelete
}) {
  const { project_id, page_id } = useParams()

  const handleDelete = async file_id => {
    try {
      const res = await fetch('/api/files/file', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ file_id: file_id })
      })

      const data = await res.json()
      if (data.status === 'success') {
        onDelete?.(file_id)
      } else {
        console.error(data.message)
      }
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/files/file?id=${file_id}`, {
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Failed to download file')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || name || 'download'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const readableDate = new Date(
    upload_date > 1e12 ? upload_date : upload_date * 1000
  ).toLocaleDateString()

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
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {filename}
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Uploaded on: {readableDate}
        </Typography>
        <Stack direction='row' spacing={1}>
          <Button variant='outlined' onClick={handleDownload}>
            Download
          </Button>
          <Button
            variant='outlined'
            color='error'
            onClick={() => handleDelete(file_id)}
          >
            Delete
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
