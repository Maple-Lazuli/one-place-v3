import { useState, useEffect } from 'react'
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

  useEffect(() => {
    async function fetchPage() {
      try {
        const res = await fetch(`/api/pages/get?id=${page_id}`, {
          credentials: 'include'
        })
        const data = await res.json()
        if (res.ok && data.status === 'success') {
          setText(data.message.content || '')
        } else {
          console.error('Failed to load page:', data.message)
        }
      } catch (err) {
        console.error('Error loading page:', err)
      }
    }
    fetchPage()
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
      } catch (err) {
        console.error('Auto-save failed:', err)
      } finally {
        setSaving(false)
      }
    }, 1000)

    return () => clearTimeout(timeout)
  }, [text, page_id])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        height: '95%', // fill parent height
        boxSizing: 'border-box',
        padding: '1rem'
      }}
    >
      <button
        onClick={() => setShowPreview((prev) => !prev)}
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
          height: showPreview ? 'calc(100% - 2rem)' : '100%', // leave space for button and status
          flexGrow: 1,
          boxSizing: 'border-box',
          overflow: 'hidden' // prevent container scrollbars
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            flex: 1,
            fontFamily: 'monospace',
            padding: 0,     
            margin: 0, 
            border: '1px solid #ccc',
            resize: 'none',
            height: '100%',
            boxSizing: 'border-box',
            overflow: 'auto'
          }}
          placeholder="Write your markdown here..."
        />

        {showPreview && (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              background: '#fff',
              border: '1px solid #ddd',
              paddingTop: 10,  // top padding of 10px
              paddingRight: '1rem',
              paddingBottom: '1rem',
              paddingLeft: '1rem',
              height: '100%',
              boxSizing: 'border-box'
            }}
          >
            <ReactMarkdown
              children={text}
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
            />
          </div>
        )}
      </div>

    </div>
  )
}
