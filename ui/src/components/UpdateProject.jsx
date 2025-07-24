import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Box,
  TextField,
  Typography,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Button,
  Divider,
} from "@mui/material"

export default function EditProject() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const nameMaxChars = 100
  const descMaxChars = 250

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [tags, setTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [newTagName, setNewTagName] = useState("")
  const [tagError, setTagError] = useState("")

  useEffect(() => {
    fetchProject()
    fetchTags()
  }, [project_id])

  async function fetchProject() {
    try {
      const res = await fetch(`/api/projects/get?id=${project_id}`, {
        method: "GET",
        credentials: "include",
      })
      const data = await res.json()
      if (data.status === "success") {
        setName(data.message.name)
        setDescription(data.message.description || "")
        setSelectedTags(data.message.tags?.map((t) => t.TagID) || [])
      } else {
        setError(data.message || "Error fetching project")
      }
    } catch (err) {
      setError(err.message || "Network error")
    }
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Project name is required")
      return
    }

    if (name.length > nameMaxChars) {
      setError(`Name cannot exceed ${nameMaxChars} characters`)
      return
    }

    if (description.length > descMaxChars) {
      setError(`Description cannot exceed ${descMaxChars} characters`)
      return
    }

    try {
      const res = await fetch("/api/projects/update", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id,
          new_project_name: name,
          new_project_description: description,
        }),
      })

      const data = await res.json()
      if (data.status !== "success") {
        setError(data.message || "Failed to update project")
        return
      }

      await fetch("/api/tags/unassign", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id }),
      })

      for (const tagId of selectedTags) {
        await fetch("/api/tags/assign", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag_id: tagId, project_id }),
        })
      }

      navigate("/projects")
    } catch (err) {
      setError("Network error")
    }
  }

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom>Edit Project</Typography>

      {error && <Typography color="error">{error}</Typography>}

      <form onSubmit={handleSubmit}>
        <TextField
          label="Project Name"
          fullWidth
          required
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          inputProps={{ maxLength: nameMaxChars }}
          helperText={`${name.length}/${nameMaxChars} characters`}
          error={name.length > nameMaxChars}
        />

        <TextField
          label="Description"
          fullWidth
          multiline
          rows={4}
          margin="normal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          inputProps={{ maxLength: descMaxChars }}
          helperText={`${description.length}/${descMaxChars} characters`}
          error={description.length > descMaxChars}
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
          Update Project
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
    </Box>
  )
}
