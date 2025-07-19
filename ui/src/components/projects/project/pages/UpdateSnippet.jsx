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

export default function UpdateSnippetForm () {
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const { project_id, page_id, snippet_id } = useParams()
  const navigate = useNavigate()

  // Fetch existing snippet data
  useEffect(() => {
    const fetchSnippet = async () => {
      try {
        const res = await fetch(`/api/code_snippet/get?id=${snippet_id}`, {
          credentials: 'include'
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load snippet.')
        }

        setTitle(data.message.name || '')
        setLanguage(data.message.language || '')
        setDescription(data.message.description || '')
        setContent(data.message.content || '')
      } catch (err) {
        setError(err.message)
      } finally {
        setFetching(false)
      }
    }

    fetchSnippet()
  }, [snippet_id])

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
        snippet_id: Number(snippet_id),
        new_name: title,
        new_description: description,
        new_language: language,
        new_content: content
      }

      const res = await fetch('/api/code_snippet/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update snippet.')
      }

      setSuccess(data.message || 'Snippet updated successfully!')
      setTimeout(() => {
        navigate(`/projects/project/${project_id}/pages/page/${page_id}/snippets`)
      }, 1000)
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
        Update Snippet
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
            {loading ? <CircularProgress size={24} /> : 'Update Snippet'}
          </Button>
        </>
      )}
    </Box>
  )
}
