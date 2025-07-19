import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'


export default function UpdateCanvasForm () {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const { project_id, page_id, canvas_id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCanvas = async () => {
      try {
        const res = await fetch(`/api/canvas/get_fields?id=${canvas_id}`, {
          credentials: 'include'
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load canvas.')
        }

        setTitle(data.message.name || '')
        setDescription(data.message.description || '')
      } catch (err) {
        setError(err.message)
      } finally {
        setFetching(false)
      }
    }

    fetchCanvas()
  }, [canvas_id])

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
        canvas_id: Number(canvas_id),
        new_name: title,
        new_description: description,
      }

      const res = await fetch('/api/canvas/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update canvas.')
      }

      setSuccess(data.message || 'canvas updated successfully!')
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
        width: '30%',
        height: '50%',
        flexGrow: 1
      }}
    >
      {/* Form Section */}
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
          Update Canvas
        </Typography>

        {fetching && <CircularProgress />}
        {error && <Alert severity='error'>{error}</Alert>}
        {success && <Alert severity='success'>{success}</Alert>}

        {!fetching && (
          <>
            <TextField
              label='Title'
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />

            <TextField
              label='Description'
              multiline
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />

            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Update Equation'}
            </Button>
          </>
        )}
      </Box>
    </Box>
  )
}
