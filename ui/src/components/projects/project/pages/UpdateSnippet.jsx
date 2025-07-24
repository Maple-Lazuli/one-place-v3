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

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Cookies from 'js-cookie';
export default function UpdateSnippetForm () {
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [coloring, setColoring] = useState(Cookies.get('preferences') === 'dark'? oneDark : oneLight)

  const { project_id, page_id, snippet_id } = useParams()
  const navigate = useNavigate()
  const contentRef = useRef(null)

  useEffect(() => {
    const fetchSnippet = async () => {
      try {
        const res = await fetch(`/api/code_snippet/get?id=${snippet_id}`, {
          credentials: 'include'
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load snippet.')
        }

        setTitle(data.message.name || '')
        setLanguage(data.message.language || '')
        setDescription(data.message.description || '')
        setContent(data.message.content || '')
      } catch (err) {
        setError(err.message)
      } finally {
        setFetching(false)
      }
    }

    fetchSnippet()
  }, [snippet_id])

  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.target
      const start = el.selectionStart
      const end = el.selectionEnd

      const updated = content.slice(0, start) + '    ' + content.slice(end)
      setContent(updated)

      // Reset caret position
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 4
      })
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title) {
      setError('Please fill in the snippet title.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        snippet_id: Number(snippet_id),
        new_name: title,
        new_description: description,
        new_language: language,
        new_content: content
      }

      const res = await fetch('/api/code_snippet/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update snippet.')
      }

      setSuccess(data.message || 'Snippet updated successfully!')
      setTimeout(() => {
        navigate(
          `/projects/project/${project_id}/pages/page/${page_id}/snippets`
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
        height: '80vh'
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
          Update Snippet
        </Typography>

        {fetching && <CircularProgress />}
        {error && <Alert severity='error'>{error}</Alert>}
        {success && <Alert severity='success'>{success}</Alert>}

        {!fetching && (
          <>
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
              label='Language'
              value={language}
              onChange={e => setLanguage(e.target.value)}
              required
            />

            <TextField
              inputRef={contentRef}
              label='Code Content'
              multiline
              rows={20}
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={handleTabKey}
              required
              InputProps={{
                sx: {
                  resize: 'horizontal',
                  overflow: 'auto',
                  fontFamily: 'monospace'
                }
              }}
            />

            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Update Snippet'}
            </Button>
          </>
        )}
      </Box>

      {/* Live Preview Section */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          border: '1px solid #ccc',
          borderRadius: 2,
          overflowY: 'auto',
          // backgroundColor: '#1e1e1e'
        }}
      >
        <Typography variant='h6' gutterBottom color='white'>
          Preview
        </Typography>
        <SyntaxHighlighter
          language={language || 'text'}
          style={coloring}
          wrapLines
          wrapLongLines
          showLineNumbers
          customStyle={{
            borderRadius: '8px',
            padding: '16px'
          }}
        >
          {content}
        </SyntaxHighlighter>
      </Box>
    </Box>
  )
}
