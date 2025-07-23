import React, { useState, useEffect, useRef } from 'react'
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
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'

export default function CreateRecipeForm () {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { project_id, page_id } = useParams()
  const navigate = useNavigate()

  // Ref for the textarea input (to manage cursor position)
  const textareaRef = useRef(null)

  // Handle pasting images as markdown
  useEffect(() => {
    const handlePaste = async e => {
      // Only proceed if focused element is the textarea
      if (document.activeElement !== textareaRef.current) return
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image')) {
          e.preventDefault() // Prevent default paste for images

          const file = item.getAsFile()
          if (!file) return

          const formData = new FormData()
          formData.append('file', file)

          try {
            const response = await fetch('/api/images/image', {
              method: 'POST',
              body: formData
            })
            const data = await response.json()
            if (data && data.id) {
              const markdown = `![image](http://${window.location.hostname}:3000/api/images/image?id=${data.id})`
              insertAtCursor(markdown)
            }
          } catch (err) {
            console.error('Image upload failed:', err)
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [content])

  // Insert markdown at the current cursor position inside textarea
  const insertAtCursor = markdown => {
    const textarea = textareaRef.current
    if (!textarea) return

    const value = content
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    // Insert markdown with newlines around for better formatting
    const insertText = `\n\n${markdown}\n\n`
    const newValue = value.slice(0, start) + insertText + value.slice(end)

    setContent(newValue)

    // After React updates, restore cursor position after inserted text
    setTimeout(() => {
      textarea.focus()
      const cursorPos = start + insertText.length
      textarea.setSelectionRange(cursorPos, cursorPos)
    }, 0)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title) {
      setError('Please fill in the Recipe title.')
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

      const res = await fetch('/api/recipes/create', {
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
        throw new Error(data.message || 'Failed to create Recipe.')
      }

      setSuccess(data.message || 'Recipe created successfully!')
      setTimeout(() => {
        navigate(
          `/projects/project/${project_id}/pages/page/${page_id}/recipes`
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
        alignItems: 'flex-start',
        width: '100%',
        px: 2
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
          gap: 2
        }}
      >
        <Typography variant='h5' component='h2' gutterBottom>
          Create New Recipe
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
          label='Content'
          multiline
          rows={20}
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          inputRef={textareaRef} // <-- add this
          InputProps={{
            sx: {
              resize: 'both',
              overflow: 'auto',
              fontFamily: 'monospace' // optional for markdown editing
            }
          }}
        />

        <Button variant='contained' type='submit' disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Create Recipe'}
        </Button>
      </Box>

      {/* LIVE PREVIEW */}
      <Box
        sx={{
          flex: 1,
          maxHeight: '600px',
          overflow: 'auto',
          border: '1px solid #ccc',
          borderRadius: 2,
          p: 2,
          bgcolor: '#f9f9f9',
          fontSize: '1rem'
        }}
      >
        <Typography variant='h6' gutterBottom>
          Preview
        </Typography>
        <ReactMarkdown
          children={content}
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
      </Box>
    </Box>
  )
}
