import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Cookies from 'js-cookie';

import 'highlight.js/styles/github.css' // or your preferred highlight theme

export default function ViewSnippet () {
  const { snippet_id } = useParams()
  const [snippet, setSnippet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [coloring, setColoring] = useState(Cookies.get('preferences') === 'dark'? oneDark : oneLight)

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
    <Box sx={{ maxWidth: '100%', mx: 'right', mt: 2, height: '100%' }}>
      <Typography variant='h4' gutterBottom>
        {snippet.name}
      </Typography>
      <Typography variant='body1' gutterBottom>
        {snippet.description}
      </Typography>
      <Typography variant='subtitle1' gutterBottom color='text.secondary'>
        Language: {snippet.language}
      </Typography>

      <Box
        sx={{
          flex: 1,
          p: 2,
          border: '1px solid #ccc',
          borderRadius: 2,
          overflow: 'auto',
          height: '100%',
          paddingBottom: '10em'
          
          // backgroundColor: '#1e1e1e'
        }}
      >
        <SyntaxHighlighter
          language={snippet.language || 'text'}
          style={coloring}
          wrapLines
          showLineNumbers
          wrapLongLines
          customStyle={{
            borderRadius: '8px',
            padding: '16px'
          }}
        >
          {snippet.content}
        </SyntaxHighlighter>
      </Box>
    </Box>
  )
}
