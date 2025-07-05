import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm';

import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css' // change to your preferred style

export default function MarkdownEditor () {
  const [text, setText] = useState(`

# ✅ Markdown with LaTeX and Code

## 📐 LaTeX Inline

Euler's identity: $e^{i\\pi} + 1 = 0$

## 📦 LaTeX Block

$$
\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\varepsilon_0}
$$

## 🧠 Code Example (Python)

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
\`\`\`

`)

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '1rem' }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        style={{
          flex: 1,
          height: '80vh',
          fontFamily: 'monospace',
          padding: '1rem'
        }}
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
    </div>
  )
}
