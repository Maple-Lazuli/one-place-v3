import { useParams, Link } from 'react-router-dom'
import { Typography, Box, Button,Divider, Grid } from '@mui/material'
import { useEffect, useState } from 'react'
import PageCard from './PageCard'

export default function Pages () {
  const { project_id } = useParams()
  const [pages, setPages] = useState([])

  useEffect(() => {
    async function fetchPages () {
      const res = await fetch(`/api/pages/get_project_pages?id=${project_id}`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (data.status === 'success') {
        setPages(data.message)
      }
    }

    fetchPages()
  }, [project_id])

  const handleDelete = deletedId => {
    setPages(prev => prev.filter(page => page.PageID !== deletedId))
  }

  return (
    <Box sx={{ p: 2, height: '100%', overflowY:'auto' }}>
      <Button
        component={Link}
        to={`/projects/project/${project_id}/pages/create`}
        variant='contained'
        // sx={{ mb: 3 }}
      >
        Create New PAge
      </Button>
      <Divider sx={{ my: 2 }}>Pages</Divider>
      <Grid container spacing={2}>
        {pages.map(page => (
          <Grid key={page.PageID}>
            <PageCard
              name={page.name}
              page_id={page.PageID}
              last_edit={page.lastEditTime}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
