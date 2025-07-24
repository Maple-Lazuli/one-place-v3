import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  TextField,
  Typography,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Button,
  Container,
  Divider,
} from "@mui/material"

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
        await fetchTags()
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
    <Container sx={{ maxWidth: 600, mx: "auto", mt: 4 }}  >
      <Typography variant="h4" gutterBottom>Create New Project</Typography>

      <form onSubmit={handleSubmitProject}>
        {error && <Typography color="error">{error}</Typography>}

        <TextField
          label="Project Name"
          fullWidth
          required
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <TextField
          label="Description"
          fullWidth
          multiline
          rows={4}
          margin="normal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          inputProps={{ maxLength: maxChars }}
          helperText={`${description.length}/${maxChars} characters`}
          error={description.length > maxChars}
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Assign Tags:</Typography>
          <FormGroup row>
            {tags.map((tag) => (
              <FormControlLabel
                key={tag.TagID}
                control={
                  <Checkbox
                    checked={selectedTags.includes(tag.TagID)}
                    onChange={() => handleTagChange(tag.TagID)}
                  />
                }
                label={tag.tag}
              />
            ))}
          </FormGroup>
        </Box>

        <Button type="submit" variant="contained" sx={{ mt: 3 }}>
          Create Project
        </Button>
      </form>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6">Create New Tag</Typography>
      <form onSubmit={handleCreateTag}>
        <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
          <TextField
            label="New tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            size="small"
          />
          <Button type="submit" variant="outlined">Create Tag</Button>
        </Box>
        {tagError && <Typography color="error" sx={{ mt: 1 }}>{tagError}</Typography>}
      </form>
    </Container>
  )
}
