import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'

export default function PageEditor() {
  const { page_id } = useParams()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const lastEditTimeRef = useRef(Date.now())    // tracks last time user edited text locally
  const lastSaveTimeRef = useRef(0)             // tracks last time we successfully saved to server
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Fetch page content from server and update text & lastEditTimeRef
  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/pages/get?id=${page_id}`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        setText(data.message.content || '')
        lastEditTimeRef.current = (data.message.lastEditTime || 0) * 1000
        // Also reset lastSaveTimeRef if server data is fresher (optional)
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
    fetchPage()
  }, [page_id])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pages/last_update?id=${page_id}`, {
          credentials: 'include'
        })
        const data = await res.json()
        if (res.ok && data.last_update && data.last_update !== 'Null') {
          const lastUpdate = Number(data.last_update) * 1000

          // Only fetch if server update is newer than both our last edit and last save time
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
    }, 1500)
    return () => clearInterval(interval)
  }, [page_id])

  // Auto-save after user edits, update lastSaveTimeRef on success
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
        lastSaveTimeRef.current = Date.now()  // mark last save time as now
      } catch (err) {
        console.error('Auto-save failed:', err)
      } finally {
        setSaving(false)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [text, page_id])

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth)
    }
  }, [])

  const handleChange = e => {
    setText(e.target.value)
    lastEditTimeRef.current = Date.now()  // mark last edit time as now
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        height: '100%',
        boxSizing: 'border-box',
        padding: '1rem',
        overflow: 'hidden'
      }}
    >
      <button
        onClick={() => setShowPreview(prev => !prev)}
        style={{
          marginBottom: '0.5rem',
          alignSelf: 'flex-start',
          padding: '0.5rem 1rem',
          cursor: 'pointer'
        }}
      >
        {showPreview ? 'Hide Preview' : 'Show Preview'}
      </button>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          height: showPreview ? 'calc(100% - 2rem)' : '100%',
          flexGrow: 1,
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <textarea
          value={text}
          onChange={handleChange}
          style={{
            flex: 1,
            fontFamily: 'monospace',
            padding: '1rem',
            border: '1px solid #ccc',
            resize: 'none',
            height: '100%',
            margin: 0,
            boxSizing: 'border-box',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}
          placeholder="Write your markdown here..."
        />

        {showPreview && (
          <div
            className="markdown-preview"
            style={{
              flexShrink: 0,
              width: containerWidth ? containerWidth * 0.45 : '45%',
              overflow: 'hidden',
              background: '#fff',
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
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                components={{
                  code({ node, inline, className, children, ...props }) {
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
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          alignSelf: 'flex-end',
          fontSize: '0.9rem',
          color: saving ? '#1976d2' : '#4caf50'
        }}
      >
        {saving ? 'Saving...' : '✓ Saved'}
      </div>
    </div>
  )
}
