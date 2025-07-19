import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button
} from '@mui/material'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

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

  const { project_id, page_id, translation_id } = useParams()
  const navigate = useNavigate()

  const fetchTranslation = async () => {
    try {
      const res = await fetch(`/api/translations/get?id=${translation_id}`, {
        credentials: 'include'
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Failed to load Translation.')

      setContent(data.message.content || '')
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
        setCurrentPageContent(data.message.content)
        setLastCurrentPageUpdate(data.message.lastUpdate)
        lastCurrentPagePollRef.current = data.message.lastUpdate
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
          { credentials: 'include' }
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
          pageData.last_update !== lastCurrentPagePollRef.current
        ) {
          fetchCurrentPage()
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 1500)

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
    }, 500)

    return () => clearTimeout(timeout)
  }, [content, translation_id])

  const handleChange = e => {
    setContent(e.target.value)
    lastEditTimeRef.current = Date.now()
  }

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      <Box
        sx={{
          display: 'flex',
          gap: 4,
          mt: 2,
          width: '100%',
          height: '100%',
          flexGrow: 1
        }}
      >
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {fetching && <CircularProgress />}
          {error && <Alert severity='error'>{error}</Alert>}

          {!fetching && (
            <textarea
              lang='auto'
              value={content}
              onChange={handleChange}
              placeholder='Type your translation...'
              style={{
                width: '100%',
                height: '70vh',
                fontFamily: 'monospace',
                fontSize: '1rem',
                padding: '1rem',
                margin: 0,
                border: '1px solid #ccc',
                borderRadius: '8px',
                resize: 'vertical',
                overflow: 'auto',
                boxSizing: 'border-box',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}
            />
          )}

          <div
            style={{
              alignSelf: 'flex-end',
              fontSize: '0.9rem',
              color: saving ? '#1976d2' : '#4caf50'
            }}
          >
            {saving ? 'Saving...' : '✓ Saved'}
          </div>
        </Box>

        <Box
          sx={{
            flex: 1,
            p: 2,
            border: '1px solid #ccc',
            borderRadius: 2,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            backgroundColor: '#fafafa',
            height: '70vh'
          }}
        >
          <Typography variant='h6' gutterBottom>
            {showCurrentPage ? 'Origional Page' : 'Translation Preview'}
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
