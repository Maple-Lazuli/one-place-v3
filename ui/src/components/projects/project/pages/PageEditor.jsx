import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { TextField, Button, Box } from '@mui/material'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { replaceImageHosts } from '../../../../utils/scripts.js'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  oneDark,
  oneLight
} from 'react-syntax-highlighter/dist/esm/styles/prism'
import Cookies from 'js-cookie'

export default function PageEditor () {
  const { page_id } = useParams()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [coloring, setColoring] = useState(
    Cookies.get('preferences') === 'dark' ? oneDark : oneLight
  )
  const [showPreview, setShowPreview] = useState(false)
  const lastEditTimeRef = useRef(Date.now())
  const lastSaveTimeRef = useRef(0)
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const textareaRef = useRef(null)
  const updateTimeout = 1000 // 1 second delay for auto-save
  const autoSaveTimeout = 500 // 500ms delay for auto-save

  useEffect(() => {
    fetchPage()
  }, [page_id])

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/pages/get?id=${page_id}`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        const uncleaned_content = data.message.content || ''
        setText(replaceImageHosts(uncleaned_content))
        lastEditTimeRef.current = (data.message.lastEditTime || 0) * 1000
        if (lastSaveTimeRef.current < lastEditTimeRef.current) {
          lastSaveTimeRef.current = lastEditTimeRef.current
        }
      } else {
        console.error('Failed to load page:', data.message)
      }
    } catch (err) {
      console.error('Error loading page:', err)
    }
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pages/last_update?id=${page_id}`, {
          credentials: 'include'
        })
        const data = await res.json()
        if (res.ok && data.last_update && data.last_update !== 'Null') {
          const lastUpdate = Number(data.last_update) * 1000
          if (
            lastUpdate > lastEditTimeRef.current &&
            lastUpdate > lastSaveTimeRef.current
          ) {
            fetchPage()
          }
        }
      } catch (err) {
        console.error('Error checking last update:', err)
      }
    }, updateTimeout)
    return () => clearInterval(interval)
  }, [page_id])

  useEffect(() => {
    if (text === '') return
    const timeout = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch('/api/pages/content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            page_id: page_id,
            content: text
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
  }, [text, page_id])

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth)
    }
  }, [])

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
  }, [])

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

    // Set the actual <textarea>'s value to keep them in sync
    textarea.value = newText
    setText(newText)

    // Restore focus and move cursor after inserted markdown
    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = start + spacedMarkdown.length
      textarea.setSelectionRange(cursor, cursor)
    })

    lastEditTimeRef.current = Date.now()

    // Immediate save after paste
    try {
      setSaving(true)
      await fetch('/api/pages/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          page_id: page_id,
          content: newText
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
    setText(e.target.value)
    lastEditTimeRef.current = Date.now()
  }

  return (
  <Box
    ref={containerRef}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      height: '100%',
      boxSizing: 'border-box',
      p: 2,
      overflow: 'hidden'
    }}
  >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          mb: 2
        }}
      >
        <Button
          variant='outlined'
          color='primary'
          size='medium'
          onClick={() => setShowPreview(prev => !prev)}
          sx={{
            textTransform: 'none' // optional: keeps normal casing
          }}
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </Button>

        <Box
          sx={{
            fontSize: '0.9rem',
            color: saving ? '#1976d2' : '#4caf50'
          }}
        >
          {saving ? 'Saving...' : '✓ Saved'}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          // height: '100%',
          flexGrow: 1,
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <TextField
          multiline
          inputRef={textareaRef}
          value={text}
          onChange={handleChange}
          placeholder='Write your markdown here...'
          fullWidth
          minRows={20}
          maxRows={Infinity}
          variant='outlined'
          sx={{
            flex: 1,
            fontFamily: 'monospace',
            overflow: 'auto',
            height: '100%',
            '& .MuiInputBase-input': {
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }
          }}
        />

        {showPreview && (
          <div
            className='markdown-preview'
            style={{
              flexShrink: 0,
              width: containerWidth ? containerWidth * 0.45 : '45%',
              overflow: 'hidden',
              // background: '#fff',
              border: '1px solid #ddd',
              padding: '1rem',
              height: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0
            }}
          >
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0
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
            </div>
          </div>
        )}
      </Box>
    </Box>
  )
}
