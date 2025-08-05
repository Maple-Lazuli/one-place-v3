import React, { useState, useRef } from 'react'
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
import {
  oneDark,
  oneLight
} from 'react-syntax-highlighter/dist/esm/styles/prism'
import Cookies from 'js-cookie'
export default function CreateSnippetForm () {
  const maxNameCharLimit = 64
  const maxLanguageCharLimit = 64
  const maxDescriptionLimit = 255

  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [coloring, setColoring] = useState(
    Cookies.get('preferences') === 'dark' ? oneDark : oneLight
  )

  const { project_id, page_id } = useParams()
  const navigate = useNavigate()
  const contentRef = useRef(null)

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
        page_id: Number(page_id),
        name: title,
        description,
        language,
        content
      }

      const res = await fetch('/api/code_snippet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      })

      let data = {}
      try {
        data = await res.json()
      } catch {}

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create snippet.')
      }

      setSuccess(data.message || 'Snippet created successfully!')
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

  const handleKeyDown = e => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = contentRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const updated =
        content.substring(0, start) + '    ' + content.substring(end)

      setContent(updated)
      // move cursor to after the inserted spaces
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4
      })
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
          Create New Snippet
        </Typography>

        {error && <Alert severity='error'>{error}</Alert>}
        {success && <Alert severity='success'>{success}</Alert>}

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
          label='Language'
          value={language}
          onChange={e => setLanguage(e.target.value)}
          required
          inputProps={{ maxLength: maxLanguageCharLimit }}
          helperText={`${language.length}/${maxLanguageCharLimit} characters`}
          error={language.length > maxLanguageCharLimit}
        />

        <TextField
          inputRef={contentRef}
          onKeyDown={handleKeyDown}
          label='Code Content'
          multiline
          // rows={20}
          value={content}
          onChange={e => setContent(e.target.value)}
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
          {loading ? <CircularProgress size={24} /> : 'Create Snippet'}
        </Button>
      </Box>

      {/* Live Preview Section */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          border: '1px solid #ccc',
          borderRadius: 2,
          overflow: 'auto',
          padding: '2em'
          // backgroundColor: '#1e1e1e'
        }}
      >
        <Typography variant='h6' gutterBottom color='white'>
          Preview
        </Typography>
        <SyntaxHighlighter
          language={language || 'text'}
          showLineNumbers
          style={coloring}
          PreTag='div'
          customStyle={{
            // background: 'transparent',
            margin: 0,
            padding: 0,
            // maxheight: 300,
            overflowX: 'auto'
          }}
        >
          {content}
        </SyntaxHighlighter>
      </Box>
    </Box>
  )
}
