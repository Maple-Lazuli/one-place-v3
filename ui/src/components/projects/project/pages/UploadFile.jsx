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

export default function UploadFileForm () {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { project_id, page_id } = useParams()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title || !file) {
      setError('Please fill in the title and select a file.')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('page_id', page_id)
      formData.append('name', title)
      formData.append('description', description)
      formData.append('file', file)

      const res = await fetch('/api/files/file', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      let data = {}
      try {
        data = await res.json()
      } catch {}

      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload file.')
      }

      setSuccess(data.message || 'File uploaded successfully!')
      setTimeout(() => {
        navigate(
          `/projects/project/${project_id}/pages/page/${page_id}/files`
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
          Upload New File
        </Typography>

        {error && <Alert severity='error'>{error}</Alert>}
        {success && <Alert severity='success'>{success}</Alert>}

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

        <Button variant='outlined' component='label'>
          Choose File
          <input
            type='file'
            hidden
            onChange={e => setFile(e.target.files[0])}
          />
        </Button>

        {file && (
          <Typography variant='body2' sx={{ mt: -1 }}>
            Selected file: {file.name}
          </Typography>
        )}

        <Button variant='contained' type='submit' disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Upload File'}
        </Button>
      </Box>
    </Box>
  )
}
