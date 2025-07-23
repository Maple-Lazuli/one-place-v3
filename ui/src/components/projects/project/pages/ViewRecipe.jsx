import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'

export default function ViewRecipe () {
  const { recipe_id } = useParams()
  const [recipe, setRecipes] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`/api/recipes/get?id=${recipe_id}`, {
          credentials: 'include'
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || 'Failed to load recipe')
        }

        const data = await res.json()
        setRecipes(data.message)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRecipes()
  }, [recipe_id])

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

  if (!recipe) {
    return null
  }

  return (
    <Box sx={{ maxWidth: '100%', mx: 'right', mt: 4 }}>
      <Typography variant='h4' gutterBottom>
        {recipe.name}
      </Typography>
      <Typography variant='body1' gutterBottom>
        {recipe.description}
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
          children={recipe.content}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex, rehypeHighlight]}
          components={{
            code ({ node, inline, className, children, ...props }) {
              return (
                <code
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    width: '100%',
                    display: 'inline-block'
                  }}
                  className={className}
                  {...props}
                >
                  {children}
                </code>
              )
            }
          }}
        />
      </Paper>
    </Box>
  )
}
