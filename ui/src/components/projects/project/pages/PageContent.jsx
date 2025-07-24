import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Divider,
  Button,
  Typography,
  Snackbar,
  Alert
} from '@mui/material'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'
import { replaceImageHosts } from '../../../../utils/scripts.js'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  oneDark,
  oneLight
} from 'react-syntax-highlighter/dist/esm/styles/prism'
import Cookies from 'js-cookie'

export default function PageContent () {
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  const { page_id } = useParams()
  const [text, setText] = useState('')
  const [translations, setTranslations] = useState([])
  const [selectedTranslationId, setSelectedTranslationId] = useState('original')
  const [lastReviewed, setLastReviewed] = useState(null)
  const [coloring, setColoring] = useState(
    Cookies.get('preferences') === 'dark' ? oneDark : oneLight
  )
  const lastEditTimeRef = useRef(0)
  const pollingRef = useRef(null)
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const pollingRate = 1000

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/pages/get?id=${page_id}`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        const uncleaned_content = data.message.content || ''
        setText(replaceImageHosts(uncleaned_content))
        lastEditTimeRef.current = data.message.lastEditTime || 0
      } else {
        console.error('Failed to load page:', data.message)
      }
    } catch (err) {
      console.error('Error loading page:', err)
    }
  }

  const fetchTranslationContent = async translationId => {
    try {
      const res = await fetch(`/api/translations/get?id=${translationId}`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        const uncleaned_content = data.message.content || ''
        setText(replaceImageHosts(uncleaned_content))
        lastEditTimeRef.current = data.message.lastEditTime || 0
      }
    } catch (err) {
      console.error('Error loading translation content:', err)
    }
  }

  const fetchTranslations = async () => {
    try {
      const res = await fetch(
        `/api/translations/get_all_by_page?id=${page_id}`,
        {
          credentials: 'include'
        }
      )
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        setTranslations(data.message || [])
      }
    } catch (err) {
      console.error('Error loading translations:', err)
    }
  }

  const fetchLastReviewed = async () => {
    try {
      const res = await fetch(
        `/api/logging/get_page_last_review?id=${page_id}`,
        {
          credentials: 'include'
        }
      )
      const data = await res.json()

      if (res.ok && data.message !== '0') {
        const utcSeconds = Number(data.message)
        const utcDate = new Date(utcSeconds * 1000)

        // Get local time by subtracting the timezone offset (in minutes)
        const offsetMs = utcDate.getTimezoneOffset() * 60 * 1000
        const localDate = new Date(utcDate.getTime() - offsetMs)

        const formatted = localDate.toLocaleString()

        setLastReviewed(formatted)
      } else {
        setLastReviewed(null)
      }
    } catch (err) {
      console.error('Error fetching last review:', err)
    }
  }

  const startPolling = (id, type) => {
    stopPolling()
    pollingRef.current = setInterval(async () => {
      try {
        const endpoint =
          type === 'original'
            ? `/api/pages/last_update?id=${id}`
            : `/api/translations/last_update?id=${id}`

        const res = await fetch(endpoint, { credentials: 'include' })
        const data = await res.json()

        if (res.ok && data.last_update && data.last_update !== 'Null') {
          const lastUpdate = Number(data.last_update)
          if (lastUpdate > lastEditTimeRef.current) {
            if (type === 'original') {
              fetchPage()
            } else {
              fetchTranslationContent(id)
            }
          }
        }
      } catch (err) {
        console.error('Error polling for updates:', err)
      }
    }, pollingRate)
  }

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  const handleReviewed = async () => {
    try {
      const res = await fetch(`/api/pages/review?id=${page_id}`, {
        method: 'POST',
        credentials: 'include'
      })
      if (res.ok) {
        setSnackbarOpen(true)
        // console.log('Page marked as reviewed successfully.')
        fetchLastReviewed() // Refresh the timestamp after review
      } else {
        alert('Failed to mark as reviewed.')
      }
    } catch (err) {
      console.error('Error marking page as reviewed:', err)
    }
  }

  useEffect(() => {
    fetchPage()
    fetchTranslations()
    fetchLastReviewed()
  }, [page_id])

  useEffect(() => {
    if (selectedTranslationId === 'original') {
      fetchPage()
      startPolling(page_id, 'original')
    } else {
      fetchTranslationContent(selectedTranslationId)
      startPolling(selectedTranslationId, 'translation')
    }

    return () => stopPolling()
  }, [selectedTranslationId, page_id])

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        maxWidth: '100%',
        overflowWrap: 'break-word',
        boxSizing: 'border-box'
      }}
    >
      <Box
        sx={{
          px: 2,
          mb: 2,
          paddingTop: 2,
          display: 'flex',
          gap: 2,
          alignItems: 'center'
        }}
      >
        <FormControl size='small'>
          <InputLabel id='translation-select-label'>Language</InputLabel>
          <Select
            labelId='translation-select-label'
            value={selectedTranslationId}
            label='Language'
            onChange={e => setSelectedTranslationId(e.target.value)}
          >
            <MenuItem value='original'>Original</MenuItem>
            {translations.map(t => (
              <MenuItem key={t.TranslationID} value={t.TranslationID}>
                {t.language}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant='outlined'
          color='success'
          onClick={handleReviewed}
          disabled={selectedTranslationId !== 'original'}
        >
          Reviewed
        </Button>

        <Typography variant='body2' sx={{ ml: 2, color: 'text.secondary' }}>
          Last Reviewed: {lastReviewed ? lastReviewed : 'Never'}
        </Typography>
      </Box>
      <Divider sx={{ my: 2 }}></Divider>
      <div
        style={{
          maxWidth: containerWidth ? containerWidth * 0.99 : '90%',
          wordBreak: 'break-word',
          height: '80vh',
          margin: 'auto',
          overflowY: 'auto'
        }}
      >
        <ReactMarkdown
          children={text}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code ({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <SyntaxHighlighter
                  language={match[1]}
                  style={coloring}
                  PreTag='div'
                  showLineNumbers
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
      </div>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity='success'
          sx={{ width: '100%' }}
        >
          Page marked as reviewed successfully.
        </Alert>
      </Snackbar>
    </div>
  )
}
