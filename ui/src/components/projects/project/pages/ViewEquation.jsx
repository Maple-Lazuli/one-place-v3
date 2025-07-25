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
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'highlight.js/styles/github.css' // or your preferred highlight theme

export default function ViewEquation () {
  const { equation_id } = useParams()
  const [equation, setEquations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchEquation = async () => {
      try {
        const res = await fetch(`/api/equations/get?id=${equation_id}`, {
          credentials: 'include'
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || 'Failed to load equation')
        }

        const data = await res.json()
        setEquations(data.message)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEquation()
  }, [equation_id])

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

  if (!equation) {
    return null
  }

  return (
    <Box sx={{ maxWidth: '100%', mx: 'right', mt: 2, height: '100%'}}>
      <Typography variant='h4' gutterBottom>
        {equation.name}
      </Typography>
      <Typography variant='body1' gutterBottom>
        {equation.description}
      </Typography>

      <Paper
        variant='outlined'
        sx={{
          flex: 1,
          p: 2,
          border: '1px solid #ccc',
          borderRadius: 2,
          overflow: 'auto',
          height: '100%',
          paddingBottom: '10em'
        }}
      >
        <ReactMarkdown
          children={equation.content}
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        />
      </Paper>
    </Box>
  )
}
