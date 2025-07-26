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
import { replaceImageHosts } from '../../../../utils/scripts.js'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  oneDark,
  oneLight
} from 'react-syntax-highlighter/dist/esm/styles/prism'
import Cookies from 'js-cookie'

export default function ViewRecipe () {
  const { recipe_id } = useParams()
  const [recipe, setRecipes] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [coloring, setColoring] = useState(
    Cookies.get('preferences') === 'dark' ? oneDark : oneLight
  )

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
    <Box sx={{ maxWidth: '100%', mx: 'auto', mt: 2, height: '100%' }}>
      <Typography variant='h4' gutterBottom>
        {recipe.name}
      </Typography>
      <Typography variant='body1' gutterBottom>
        {recipe.description}
      </Typography>

      <Paper
        variant='outlined'
        sx={{
          flex: 1,
          border: '1px solid #ccc',
          borderRadius: 2,
          overflow: 'auto',
          height: '100%',
          padding: '1em',
          paddingBottom: '10em'
        }}
      >
              <ReactMarkdown
                children={replaceImageHosts(recipe.content)}
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code ({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        language={match[1]}
                        showLineNumbers
                        style={coloring}
                        PreTag='div'
                        customStyle={{
                          // background: 'transparent',
                          margin: 0,
                          padding: 0,
                          maxheight: 300,
                          overflowX: 'auto'
                        }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code
                        className={className}
                        style={{
                          backgroundColor: '#eee',
                          padding: '0.2em 0.4em',
                          borderRadius: '4px',
                          fontSize: '0.95em'
                        }}
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
