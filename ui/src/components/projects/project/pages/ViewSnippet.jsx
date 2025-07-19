import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css' // or your preferred highlight theme

export default function ViewSnippet () {
  const { snippet_id } = useParams()
  const [snippet, setSnippet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSnippet = async () => {
      try {
        const res = await fetch(`/api/code_snippet/get?id=${snippet_id}`, {
          credentials: 'include'
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || 'Failed to load snippet')
        }

        const data = await res.json()
        setSnippet(data.message)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSnippet()
  }, [snippet_id])

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    )
  }

  if (!snippet) {
    return null
  }

  return (
    <Box sx={{ maxWidth: '100%', mx: 'right', mt: 4 }}>
      <Typography variant='h4' gutterBottom>
        {snippet.name}
      </Typography>
      <Typography variant='subtitle1' gutterBottom color="text.secondary">
        Language: {snippet.language}
      </Typography>
      <Typography variant='body1' gutterBottom>
        {snippet.description}
      </Typography>

      <Paper
        variant='outlined'
        sx={{
          mt: 2,
          p: 2,
          backgroundColor: '#f6f8fa',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace'
        }}
      >
        <ReactMarkdown
          children={snippet.content}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        />
      </Paper>
    </Box>
  )
}
