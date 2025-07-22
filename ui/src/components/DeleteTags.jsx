import { useEffect, useState } from 'react'

export default function DeleteTags() {
  const [tags, setTags] = useState([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Fetch all tags on mount
  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    setError("")
    try {
      const res = await fetch('/api/tags/get', {
        method: 'GET',
        credentials: 'include',
      })

      const data = await res.json()

      if (data.status === 'success') {
        setTags(data.message)
      } else {
        setError(data.message || "Failed to load tags")
      }
    } catch (err) {
      setError("Network error while fetching tags")
    }
  }

  async function handleDelete(tag_id) {
    setError("")
    setSuccess("")
    try {
      const res = await fetch('/api/tags/delete', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tag_id })
      })

      const data = await res.json()

      if (data.status === 'success') {
        setSuccess(`Deleted tag ${tag_id}`)
        // Re-fetch tags after deletion
        fetchTags()
      } else {
        setError(data.message || "Failed to delete tag")
      }
    } catch (err) {
      setError("Network error while deleting tag")
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>Delete Tags</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      {tags.length === 0 ? (
        <p>No tags found.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tags.map(tag => (
            <li
              key={tag.TagID}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
                border: '1px solid #ccc',
                padding: '0.5rem',
                borderRadius: '4px'
              }}
            >
              <span>{tag.tag}</span>
              <button
                onClick={() => handleDelete(tag.TagID)}
                style={{
                  backgroundColor: 'red',
                  color: 'white',
                  border: 'none',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
