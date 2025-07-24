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

export default function CreatePageForm () {
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const maxPageNameChars = 64

  const { project_id } = useParams()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title) {
      setError('Please fill in the page title')
      return
    }

    setLoading(true)

    try {
      const payload = {
        project_id: Number(project_id), // convert string param to number
        name: title
      }

      const res = await fetch('/api/pages/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include' // send cookies (token)
      })

      // parse JSON safely
      let data = {}
      try {
        data = await res.json()
      } catch {
        // response might not be JSON, ignore
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create page.')
      }
      setSuccess(data.message || 'Page created successfully!')
      setTimeout(() => navigate(`/projects/project/${project_id}/pages`), 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      component='form'
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 400,
        mx: 'auto',
        mt: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
    >
      <Typography variant='h5' component='h2' gutterBottom>
        Create New Page
      </Typography>

      {error && <Alert severity='error'>{error}</Alert>}
      {success && <Alert severity='success'>{success}</Alert>}

      <TextField
        label='Page Name'
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
        inputProps={{ maxLength: maxPageNameChars }}
        helperText={`${title.length}/${maxPageNameChars} characters`}
        error={title.length > maxPageNameChars}
      />

      <Button variant='contained' type='submit' disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Create PAge'}
      </Button>
    </Box>
  )
}
