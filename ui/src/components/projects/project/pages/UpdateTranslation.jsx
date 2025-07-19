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

export default function UpdateTranslation () {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const { project_id, page_id, translation_id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchTranslation = async () => {
      try {
        const res = await fetch(`/api/translations/get?id=${translation_id}`, {
          credentials: 'include'
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load Translation.')
        }
        setContent(data.message.content || '')
      } catch (err) {
        setError(err.message)
      } finally {
        setFetching(false)
      }
    }

    fetchTranslation()
  }, [translation_id])

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    setLoading(true)

    try {
      const payload = {
        translation_id: Number(translation_id),
        new_content: content
      }

      const res = await fetch('/api/translations/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update Translation.')
      }

      setSuccess(data.message || 'Translation updated successfully!')
      setTimeout(() => {
        navigate(
          `/projects/project/${project_id}/pages/page/${page_id}/translations`
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
        width: '100%',
        height: '100%',
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
          Update {} Translation
        </Typography>

        {fetching && <CircularProgress />}
        {error && <Alert severity='error'>{error}</Alert>}
        {success && <Alert severity='success'>{success}</Alert>}

        {!fetching && (
          <>

            <TextField
              label='Content'
              multiline
              rows={20}
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
              {loading ? <CircularProgress size={24} /> : 'Update Translation'}
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
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          backgroundColor: '#fafafa',
          height: '90%'
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
