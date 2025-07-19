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

export default function CreateSnippetForm () {
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
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
      setError('Please fill in the snippet title.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        page_id: Number(page_id), // convert string param to number
        name: title,
        description: description,
        language: language,
        content: content
      }

      const res = await fetch('/api/code_snippet/create', {
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
        throw new Error(data.message || 'Failed to create snippet.')
      }
      setSuccess(data.message || 'Snippet created successfully!')
      setTimeout(
        () =>
          navigate(
            `/projects/project/${project_id}/pages/page/${page_id}/snippets`
          ),
        1000
      )
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
        Create New Snippet
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

      <TextField
        label='Language'
        value={language}
        onChange={e => setLanguage(e.target.value)}
        required
      />

      <TextField
        label='Code Content'
        multiline
        rows={4}
        value={content}
        onChange={e => setContent(e.target.value)}
        required
      />

      <Button variant='contained' type='submit' disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Create Snippet'}
      </Button>
    </Box>
  )
}
