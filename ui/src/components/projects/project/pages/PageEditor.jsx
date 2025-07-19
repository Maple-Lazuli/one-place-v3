import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'

export default function PageEditor () {
  const { project_id, page_id } = useParams()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  // Load initial content
  useEffect(() => {
    async function fetchPage () {
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

  // Auto-save on text change
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
    }, 1000) // Save 1 second after last change

    return () => clearTimeout(timeout)
  }, [text, page_id])

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '1rem' }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        style={{
          flex: 1,
          height: '80vh',
          fontFamily: 'monospace',
          padding: '1rem',
          border: '1px solid #ccc'
        }}
        placeholder="Write your markdown here..."
      />
      <div
        style={{
          flex: 1,
          height: '80vh',
          overflowY: 'auto',
          padding: '1rem',
          background: '#fff',
          border: '1px solid #ddd'
        }}
      >
        <ReactMarkdown
          children={text}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex, rehypeHighlight]}
        />
      </div>
      <div style={{ position: 'absolute', bottom: 10, right: 20 }}>
        {saving ? 'Saving...' : '✓ Saved'}
      </div>
    </div>
  )
}
