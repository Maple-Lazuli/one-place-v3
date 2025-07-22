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
  Select
} from '@mui/material'

import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'

export default function PageContent() {
  const { page_id } = useParams()
  const [text, setText] = useState('')
  const [translations, setTranslations] = useState([])
  const [selectedTranslationId, setSelectedTranslationId] = useState('original')
  const lastEditTimeRef = useRef(0)
  const pollingRef = useRef(null)
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/pages/get?id=${page_id}`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        setText(data.message.content || '')
        lastEditTimeRef.current = data.message.lastEditTime || 0
      } else {
        console.error('Failed to load page:', data.message)
      }
    } catch (err) {
      console.error('Error loading page:', err)
    }
  }

  const fetchTranslationContent = async (translationId) => {
    try {
      const res = await fetch(`/api/translations/get?id=${translationId}`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        setText(data.message.content || '')
        lastEditTimeRef.current = data.message.lastEditTime || 0
      }
    } catch (err) {
      console.error('Error loading translation content:', err)
    }
  }

  const fetchTranslations = async () => {
    try {
      const res = await fetch(`/api/translations/get_all_by_page?id=${page_id}`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        setTranslations(data.message || [])
      }
    } catch (err) {
      console.error('Error loading translations:', err)
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
    }, 500)
  }

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  useEffect(() => {
    fetchPage()
    fetchTranslations()
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
      <Box sx={{ px: 2, mb: 2 }}>
        <FormControl size="small">
          <InputLabel id="translation-select-label">Language</InputLabel>
          <Select
            labelId="translation-select-label"
            value={selectedTranslationId}
            label="Language"
            onChange={(e) => setSelectedTranslationId(e.target.value)}
          >
            <MenuItem value="original">Original</MenuItem>
            {translations.map((t) => (
              <MenuItem key={t.TranslationID} value={t.TranslationID}>
                {t.language}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <div
        style={{
          maxWidth: containerWidth ? containerWidth * 0.9 : '90%',
          wordBreak: 'break-word',
          height: '80vh',
          margin: 'auto',
          overflowY: 'auto'
        }}
      >
        <ReactMarkdown
          children={text}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex, rehypeHighlight]}
        />
      </div>
    </div>
  )
}
