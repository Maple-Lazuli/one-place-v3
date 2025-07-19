import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'

export default function UpdatePageForm() {
  const { project_id, page_id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  useEffect(() => {
    async function fetchPage() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/pages/get?id=${page_id}`, {
          credentials: 'include',
        })
        const data = await res.json()

        if (!res.ok || data.status === 'error') {
          throw new Error(data.message || 'Failed to load page data')
        }

        const page = data.message 

        setTitle(page.name || '')

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPage()
  }, [page_id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title) {
      setError('Please fill in the page title.')
      return
    }

    setSubmitLoading(true)

    try {
      const payload = {
        page_id: page_id,
        name: title,
      }

      if (duration) {
        payload.new_duration = parseInt(duration, 10)
      }

      const res = await fetch('/api/pages/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || 'Failed to update page.')
      }

      setSuccess(data.message || 'Page updated successfully!')
      setTimeout(() => navigate(`/projects/project/${project_id}/pages`), 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 400,
        mx: 'auto',
        mt: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Update Page
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <TextField
        label="Page Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <Button variant="contained" type="submit" disabled={submitLoading}>
        {submitLoading ? <CircularProgress size={24} /> : 'Update Page'}
      </Button>
    </Box>
  )
}
