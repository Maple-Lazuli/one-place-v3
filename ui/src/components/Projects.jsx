import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Snackbar,
  Alert,
  Grid,
  Container,
  Divider,
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import ProjectCard from './ProjectCard'

export default function Projects () {
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [tags, setTags] = useState([])
  const [selectedTag, setSelectedTag] = useState('')
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetchTags()
    fetchProjects()
  }, [])

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags/get', { credentials: 'include' })
      const data = await res.json()
      if (data.status === 'success') {
        const sortedTags = data.message.sort((a, b) =>
          a.tag.toLowerCase().localeCompare(b.tag.toLowerCase())
        )
        setTags(sortedTags)
      } else {
        console.error('Failed to load tags')
      }
    } catch (err) {
      console.error('Error loading tags', err)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects/get_all', {
        method: 'GET',
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Unauthorized or failed request')
      const data = await res.json()
      if (data.status === 'success') {
        const projectList = data.message
        if (!projectList || projectList.length === 0) {
          setError('No projects found.')
          setProjects([])
          setFilteredProjects([])
          setOpen(true)
        } else {
          setProjects(projectList)
          setFilteredProjects(projectList)
          setError('')
          setOpen(false)
        }
      } else {
        setError(data.message || 'Failed to fetch projects')
        setProjects([])
        setFilteredProjects([])
        setOpen(true)
      }
    } catch (err) {
      setError(err.message || 'Network error')
      setProjects([])
      setFilteredProjects([])
      setOpen(true)
    }
  }

  const handleTagFilter = e => {
    const tagId = e.target.value
    setSelectedTag(tagId)

    if (!tagId) {
      setFilteredProjects(projects)
      return
    }

    const filtered = projects.filter(project =>
      (project.tags || []).some(t => t.TagID === tagId)
    )
    setFilteredProjects(filtered)
  }

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return
    setOpen(false)
  }

  const handleDelete = deletedId => {
    const updated = projects.filter(p => p.ProjectID !== deletedId)
    setProjects(updated)
    setFilteredProjects(
      selectedTag
        ? updated.filter(project =>
            (project.tags || []).some(t => t.TagID === selectedTag)
          )
        : updated
    )
  }

  return (
    <Box
      sx={{ width: '100vw', height: '94vh', overflowY: 'auto', px: 4, py: 4 }}
    >
      <Typography variant='h4' gutterBottom>
        Projects
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Link to='/projects/create' style={{ textDecoration: 'none' }}>
          <Button variant='contained'>Create New Project</Button>
        </Link>

        <FormControl sx={{ minWidth: 200, marginLeft: 'auto' }}>
          <InputLabel id='tag-select-label'>Filter by Tag</InputLabel>
          <Select
            labelId='tag-select-label'
            value={selectedTag}
            label='Filter by Tag'
            onChange={handleTagFilter}
          >
            <MenuItem value=''>All</MenuItem>
            {tags.map(tag => (
              <MenuItem key={tag.TagID} value={tag.TagID}>
                {tag.tag}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ my: 2 }}>Projects</Divider>

      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity='error' sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {filteredProjects.length === 0 && !open ? (
        <Typography>
          No projects available. Create one to get started.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredProjects.map(p => (
            <Grid key={p.ProjectID}>
              <ProjectCard
                name={p.name}
                description={p.description}
                project_id={p.ProjectID}
                onDelete={handleDelete}
                tags={p.tags}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
