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

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export default function CreateEquationForm () {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const maxNameCharLimit = 64
  const maxDescriptionLimit = 255

  const { project_id, page_id } = useParams()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title) {
      setError('Please fill in the Equation title.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        page_id: Number(page_id),
        name: title,
        description,
        content
      }

      const res = await fetch('/api/equations/create', {
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
        throw new Error(data.message || 'Failed to create Equation.')
      }

      setSuccess(data.message || 'Equation created successfully!')
      setTimeout(() => {
        navigate(
          `/projects/project/${project_id}/pages/page/${page_id}/equations`
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
        mt: 2,
        height: '100%'
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
          gap: 2,
          overflowY: 'auto',
          padding: '2em'
        }}
      >
        <Typography variant='h5' component='h2' gutterBottom>
          Create New Equation
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

        <TextField
          label='Content'
          multiline
          rows={20}
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          InputProps={{
            sx: {
              resize: 'both',
              overflow: 'auto'
            }
          }}
        />

        <Button variant='contained' type='submit' disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Create Equation'}
        </Button>
      </Box>

      {/* LIVE PREVIEW */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          border: '1px solid #ccc',
          borderRadius: 2,
          overflow: 'auto',
          padding: '2em'
        }}
      >
        <Typography variant='h6' gutterBottom>
          Preview
        </Typography>
        <ReactMarkdown
          children={content}
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        />
      </Box>
    </Box>
  )
}
