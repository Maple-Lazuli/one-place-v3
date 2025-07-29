import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'

export default function StartCanvas () {
  const maxNameCharLimit = 64
  const maxDescriptionLimit = 255

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { project_id, page_id } = useParams()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title) {
      setError('Please fill in the Canvas title.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        page_id: Number(page_id),
        name: title,
        description: description,
        content: "[]"
      }

      const res = await fetch('/api/canvas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      })

      let data = {}
      try {
        data = await res.json()
      } catch {}

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create canvas.')
      }

      setSuccess(data.message || 'Canvas created successfully!')
      setTimeout(() => {
        navigate(
          `/projects/project/${project_id}/pages/page/${page_id}/canvases`
        )
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 4,
        mt: 4,
        alignItems: 'flex-start',
        width: '30%',
        px: 2
      }}
    >
      {/* FORM */}
      <Box
        component='form'
        onSubmit={handleSubmit}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Typography variant='h5' component='h2' gutterBottom>
          Create New Canvas
        </Typography>

        {error && <Alert severity='error'>{error}</Alert>}
        {success && <Alert severity='success'>{success}</Alert>}

        <TextField
          label='Name'
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          inputProps={{ maxLength: maxNameCharLimit }}
          helperText={`${title.length}/${maxNameCharLimit} characters`}
          error={title.length > maxNameCharLimit}
        />

        <TextField
          label='Description'
          multiline
          rows={2}
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          inputProps={{ maxLength: maxDescriptionLimit }}
          helperText={`${description.length}/${maxDescriptionLimit} characters`}
          error={description.length > maxDescriptionLimit}
        />

        <Button variant='contained' type='submit' disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Create Canvas'}
        </Button>
      </Box>
    </Box>
  )
}
