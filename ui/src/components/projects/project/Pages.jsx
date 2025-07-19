import { useParams, Link } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  Grid
} from '@mui/material'
import { useEffect, useState } from 'react'
import PageCard from './PageCard'

export default function Pages() {
  const { project_id } = useParams()
  const [pages, setPages] = useState([])

  useEffect(() => {
    async function fetchPages() {
      const res = await fetch(`/api/pages/get_pages_by_project?project_id=${project_id}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.status === 'success') {
        setPages(data.message)
      }
    }

    fetchPages()
  }, [project_id])

  const handleDelete = (deletedId) => {
    setPages((prev) => prev.filter((page) => page.PageID !== deletedId))
  }


  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Pages for Project {project_id}
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Pages for the project
      </Typography>

      <Button
        component={Link}
        to={`/projects/project/${project_id}/pages/create`}
        variant="contained"
        sx={{ mb: 3 }}
      >
        Create New PAge
      </Button>

      <Typography variant="h6" gutterBottom>Pages</Typography>
      <Grid container spacing={2}>
        {pages.map((page) => (
          <Grid key={page.PageID}>
            <PageCard
              name={page.name}
              page_id={page.PageID}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>

    </Box>
  )
}
