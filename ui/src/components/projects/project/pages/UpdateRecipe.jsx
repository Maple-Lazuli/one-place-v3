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
import { replaceImageHosts } from '../../../../utils/scripts.js'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  oneDark,
  oneLight
} from 'react-syntax-highlighter/dist/esm/styles/prism'
import Cookies from 'js-cookie'

export default function UpdateRecipeForm () {
  const maxNameCharLimit = 64
  const maxDescriptionLimit = 255
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [coloring, setColoring] = useState(
    Cookies.get('preferences') === 'dark' ? oneDark : oneLight
  )
  const { project_id, page_id, recipe_id } = useParams()
  const navigate = useNavigate()

  // Create ref to the textarea to manage cursor & insertions
  const textareaRef = useRef(null)

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await fetch(`/api/recipes/get?id=${recipe_id}`, {
          credentials: 'include'
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load recipe.')
        }

        setTitle(data.message.name || '')
        setDescription(data.message.description || '')
        const uncleaned_content = data.message.content || ''
        setContent(replaceImageHosts(uncleaned_content))
      } catch (err) {
        setError(err.message)
      } finally {
        setFetching(false)
      }
    }

    fetchRecipe()
  }, [recipe_id])

  // Paste handler to upload images and insert markdown
  useEffect(() => {
    const handlePaste = async e => {
      if (document.activeElement !== textareaRef.current) return
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image')) {
          e.preventDefault() // Prevent default image paste

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
              const markdown = `![image](http://${window.location.host}/api/images/image?id=${data.id})`
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

  // Insert markdown text at cursor position inside content
  const insertAtCursor = markdown => {
    const textarea = textareaRef.current
    if (!textarea) return

    const value = content
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    const insertText = `\n${markdown}\n`
    const newValue = value.slice(0, start) + insertText + value.slice(end)

    setContent(newValue)

    // Reset cursor position after state update
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
      setError('Please fill in the recipe title.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        recipe_id: Number(recipe_id),
        new_name: title,
        new_description: description,
        new_content: content
      }

      const res = await fetch('/api/recipes/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update Recipe.')
      }

      setSuccess(data.message || 'Recipe updated successfully!')
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
          Update Recipes
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
              rows={20}
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              inputRef={textareaRef} // <-- Add ref here
              InputProps={{
                sx: {
                  resize: 'vertical',
                  overflow: 'auto',
                  fontFamily: 'monospace' // optional, helps markdown editing
                }
              }}
            />

            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Update Recipe'}
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
          padding: '2em'
        }}
      >
        <Typography variant='h6' gutterBottom>
          Preview
        </Typography>
        <ReactMarkdown
          children={content}
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
                          // backgroundColor: '#eee',
                          padding: '0.2em 0.4em',
                          borderRadius: '4px',
                          fontSize: '0.95em',
                          fontFamily: 'monospace'
                  }}
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
