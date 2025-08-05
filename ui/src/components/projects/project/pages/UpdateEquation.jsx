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

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export default function UpdateEquationForm () {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const maxNameCharLimit = 64
  const maxDescriptionLimit = 255

  const { project_id, page_id, equation_id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchEquation = async () => {
      try {
        const res = await fetch(`/api/equations/get?id=${equation_id}`, {
          credentials: 'include'
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load equation.')
        }

        setTitle(data.message.name || '')
        setDescription(data.message.description || '')
        setContent(data.message.content || '')
      } catch (err) {
        setError(err.message)
      } finally {
        setFetching(false)
      }
    }

    fetchEquation()
  }, [equation_id])

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title) {
      setError('Please fill in the equation title.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        equation_id: Number(equation_id),
        new_name: title,
        new_description: description,
        new_content: content
      }

      const res = await fetch('/api/equations/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update Equation.')
      }

      setSuccess(data.message || 'Equation updated successfully!')
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
      {/* Form Section */}
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
          Update Equation
        </Typography>

        {fetching && <CircularProgress />}
        {error && <Alert severity='error'>{error}</Alert>}
        {success && <Alert severity='success'>{success}</Alert>}

        {!fetching && (
          <>
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
              // rows={20}
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              InputProps={{
                sx: {
                  resize: 'vertical',
                  overflow: 'auto'
                }
              }}
            />

            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Update Equation'}
            </Button>
          </>
        )}
      </Box>

      {/* Preview Section */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          border: '1px solid #ccc',
          borderRadius: 2,
          overflowY: 'auto',
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
