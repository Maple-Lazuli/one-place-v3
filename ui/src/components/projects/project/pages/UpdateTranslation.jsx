import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Button
} from '@mui/material'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { replaceImageHosts } from '../../../../utils/scripts.js'

export default function UpdateTranslation () {


  const [content, setContent] = useState('')
  const [language, setLanguage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [showCurrentPage, setShowCurrentPage] = useState(false)
  const [currentPageContent, setCurrentPageContent] = useState('')
  const [lastCurrentPageUpdate, setLastCurrentPageUpdate] = useState(null)

  const lastEditTimeRef = useRef(Date.now())
  const lastSaveTimeRef = useRef(0)
  const lastCurrentPagePollRef = useRef(null)
  const textareaRef = useRef(null)
  const updateTimeout = 1000 // 1 second delay for auto-save
  const autoSaveTimeout = 500 // 500ms delay for auto-save

  const { project_id, page_id, translation_id } = useParams()
  const navigate = useNavigate()

  const fetchTranslation = async () => {
    try {
      const res = await fetch(`/api/translations/get?id=${translation_id}`, {
        credentials: 'include'
      })
      const data = await res.json()

      if (!res.ok)
        throw new Error(data.message || 'Failed to load Translation.')

      setContent(replaceImageHosts(data.message.content || ''))
      setLanguage(data.message.language || '')

      lastEditTimeRef.current = (data.message.lastEditTime || 0) * 1000
      if (lastSaveTimeRef.current < lastEditTimeRef.current) {
        lastSaveTimeRef.current = lastEditTimeRef.current
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setFetching(false)
    }
  }

  const fetchCurrentPage = async () => {
    try {
      const res = await fetch(`/api/pages/get?id=${page_id}`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok && data.message) {
        setCurrentPageContent(replaceImageHosts(data.message.content))
        setLastCurrentPageUpdate(Number(data.message.lastUpdate) * 1000)
        lastCurrentPagePollRef.current = data.message.lastUpdate * 1000
      }
    } catch (err) {
      console.error('Error fetching current page:', err)
    }
  }

  useEffect(() => {
    fetchTranslation()
    fetchCurrentPage()
  }, [translation_id])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/translations/last_update?id=${translation_id}`,
          {
            credentials: 'include'
          }
        )
        const data = await res.json()

        if (res.ok && data.last_update && data.last_update !== 'Null') {
          const lastUpdate = Number(data.last_update) * 1000
          if (
            lastUpdate > lastEditTimeRef.current &&
            lastUpdate > lastSaveTimeRef.current
          ) {
            fetchTranslation()
          }
        }

        const pageRes = await fetch(`/api/pages/last_update?id=${page_id}`, {
          credentials: 'include'
        })
        const pageData = await pageRes.json()
        if (
          pageRes.ok &&
          pageData.last_update &&
          pageData.last_update > lastCurrentPagePollRef.current
        ) {
          fetchCurrentPage()
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, updateTimeout)

    return () => clearInterval(interval)
  }, [translation_id, page_id])

  useEffect(() => {
    if (content === '') return

    const timeout = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch('/api/translations/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            translation_id: Number(translation_id),
            new_content: content
          })
        })
        lastSaveTimeRef.current = Date.now()
      } catch (err) {
        console.error('Auto-save failed:', err)
      } finally {
        setSaving(false)
      }
    }, autoSaveTimeout)

    return () => clearTimeout(timeout)
  }, [content, translation_id])

  useEffect(() => {
    const handlePaste = async e => {
      if (document.activeElement !== textareaRef.current) return
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image')) {
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
              await insertAtCursor(markdown)
            }
          } catch (err) {
            console.error('Image upload failed:', err)
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [translation_id])

  const insertAtCursor = async markdown => {
    const textarea = textareaRef.current
    if (!textarea) return

    const currentValue = textarea.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    const before = currentValue.slice(0, start)
    const after = currentValue.slice(end)

    const spacedMarkdown = `\n\n${markdown}\n\n`
    const newText = before + spacedMarkdown + after

    textarea.value = newText
    setContent(newText)

    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = start + spacedMarkdown.length
      textarea.setSelectionRange(cursor, cursor)
    })

    lastEditTimeRef.current = Date.now()

    try {
      setSaving(true)
      await fetch('/api/translations/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          translation_id: Number(translation_id),
          new_content: newText
        })
      })
      lastSaveTimeRef.current = Date.now()
    } catch (err) {
      console.error('Auto-save after paste failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = e => {
    setContent(e.target.value)
    lastEditTimeRef.current = Date.now()
  }

  return (
    <Box sx={{ p: 1, height: '100%', overflow:'auto' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant='h5' component='h2' gutterBottom>
          Updating {language} Translation
        </Typography>
        <Button
          variant='outlined'
          onClick={() => setShowCurrentPage(prev => !prev)}
        >
          {showCurrentPage ? 'Show Translation' : 'Show Current Page'}
        </Button>
      </Box>
      <div
        style={{
          alignSelf: 'flex-start',
          fontSize: '0.9rem',
          color: saving ? '#1976d2' : '#4caf50'
        }}
      >
        {saving ? 'Saving...' : '✓ Saved'}
      </div>

      <Box
        sx={{
          display: 'flex',
          gap: 4,
          mt: 2,
          width: '100%',
          height: '85%',
          flexGrow: 1
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            height: '100%',
            overflow: 'auto'
          }}
        >
          {fetching && <CircularProgress />}
          {error && <Alert severity='error'>{error}</Alert>}
          {!fetching && (
            <TextField
              inputRef={textareaRef}
              multiline
              fullWidth
              // rows={20}
              value={content}
              onChange={handleChange}
              placeholder='Type your translation...'
              variant='outlined'
              sx={{
                fontFamily: 'monospace',
                fontSize: '1rem',
                '& .MuiInputBase-input': {
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }
              }}
            />
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            p: 2,
            border: '1px solid #ccc',
            borderRadius: 2,
            whiteSpace: 'pre-wrap',
            // backgroundColor: '#fafafa',
           height: '100%',
            overflow: 'auto'
          }}
        >
          <Typography variant='h6' gutterBottom>
            {showCurrentPage ? 'Original Source' : 'Translation Preview'}
          </Typography>
          <ReactMarkdown
            children={showCurrentPage ? currentPageContent : content}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          />
        </Box>
      </Box>
    </Box>
  )
}
