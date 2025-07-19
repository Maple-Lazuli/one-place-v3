import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'

export default function PageContent() {
  const { page_id } = useParams()
  const [text, setText] = useState('')
  const lastEditTimeRef = useRef(0)
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Function to fetch page content
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

  // Initial content load
  useEffect(() => {
    fetchPage()
  }, [page_id])

  // Poll for updates every 500ms
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pages/last_update?id=${page_id}`, {
          credentials: 'include'
        })
        const data = await res.json()

        if (res.ok && data.last_update && data.last_update !== 'Null') {
          const lastUpdate = Number(data.last_update)
          if (lastUpdate > lastEditTimeRef.current) {
            fetchPage()
          }
        }
      } catch (err) {
        console.error('Error checking last update:', err)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [page_id])

  // Measure container width on mount
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
        // maxHeight: '100%',
        padding: '1rem',
        overflowWrap: 'break-word',
        boxSizing: 'border-box'

      }}
    >
      <div
        style={{
          maxWidth: containerWidth ? containerWidth * 0.9 : '90%',
          wordBreak: 'break-word',
          // maxHeight: '100%',
          overflowWrap: 'break-word',
        //   whiteSpace: 'pre-wrap',
        height: '10vh',
          margin: 'auto'
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
