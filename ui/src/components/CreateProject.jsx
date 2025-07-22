import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function CreateProject() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [tags, setTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])

  const [newTagName, setNewTagName] = useState("")
  const [tagError, setTagError] = useState("")

  const navigate = useNavigate()
  const maxChars = 250

  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    try {
      const res = await fetch("/api/tags/get", { credentials: "include" })
      const data = await res.json()
      if (data.status === "success") {
        setTags(data.message)
      }
    } catch (err) {
      console.error("Failed to load tags")
    }
  }

  const handleTagChange = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleCreateTag = async (e) => {
    e.preventDefault()
    setTagError("")

    if (!newTagName.trim()) {
      setTagError("Tag name cannot be empty")
      return
    }

    try {
      const res = await fetch("/api/tags/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: newTagName }),
      })

      const data = await res.json()
      if (data.status === "success") {
        setNewTagName("")
        await fetchTags() // Refresh tags list
      } else {
        setTagError(data.message || "Could not create tag")
      }
    } catch (err) {
      setTagError("Network error")
    }
  }

  const handleSubmitProject = async (e) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Project name is required")
      return
    }

    if (description.length > maxChars) {
      setError(`Description cannot exceed ${maxChars} characters`)
      return
    }

    try {
      const response = await fetch("/api/projects/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_name: name, project_description: description }),
      })

      const data = await response.json()

      if (data.status === "success") {
        const projectId = data.project_id || data.message?.project_id

        // Assign selected tags
        for (const tagId of selectedTags) {
          await fetch("/api/tags/assign", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag_id: tagId, project_id: projectId }),
          })
        }

        navigate("/projects")
      } else {
        setError(data.message || "Failed to create project")
      }
    } catch (err) {
      setError("Network error")
    }
  }

  return (
    <div className="container">
      <h2>Create New Project</h2>

      <form onSubmit={handleSubmitProject}>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div>
          <label htmlFor="project_name">Project Name:</label>
          <input
            id="project_name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="project_description">Description:</label>
          <textarea
            id="project_description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={maxChars}
            rows={4}
          />
          <p style={{ fontSize: "0.9em", color: description.length > maxChars ? "red" : "gray" }}>
            {description.length}/{maxChars} characters
          </p>
        </div>

        <div>
          <label>Assign Tags:</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {tags.map((tag) => (
              <label key={tag.TagID} style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.TagID)}
                  onChange={() => handleTagChange(tag.TagID)}
                />
                <span style={{ marginLeft: 6 }}>{tag.tag}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" style={{ marginTop: 16 }}>
          Create Project
        </button>
      </form>

      {/* Tag Creation Form (separate) */}
      <div style={{ marginTop: "2em", borderTop: "1px solid #ccc", paddingTop: "1em" }}>
        <h4>Create New Tag</h4>
        <form onSubmit={handleCreateTag}>
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name"
          />
          <button type="submit">Create Tag</button>
        </form>
        {tagError && <p style={{ color: "red" }}>{tagError}</p>}
      </div>
    </div>
  )
}
