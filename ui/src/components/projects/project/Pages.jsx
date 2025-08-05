import { useParams, Link } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  Divider,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import { useEffect, useState, useMemo } from 'react'
import PageCard from './PageCard'

export default function Pages () {
  const { project_id } = useParams()
  const [pages, setPages] = useState([])
  const [sortBy, setSortBy] = useState('lastEdit') // default: last edited

  useEffect(() => {
    let intervalId
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
    intervalId = setInterval(fetchPages, 5000)
    return () => clearInterval(intervalId)
  }, [project_id])

  const handleDelete = deletedId => {
    setPages(prev => prev.filter(page => page.PageID !== deletedId))
  }

  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'creation') {
        return new Date(b.timeCreated) - new Date(a.timeCreated)
      } else {
        return new Date(b.lastEditTime) - new Date(a.lastEditTime)
      }
    })
  }, [pages, sortBy])

  return (
    <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button
          component={Link}
          to={`/projects/project/${project_id}/pages/create`}
          variant='contained'
        >
          Create New Page
        </Button>

        <FormControl size='small'>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label='Sort By'
            onChange={e => setSortBy(e.target.value)}
          >
            <MenuItem value='lastEdit'>Last Edited</MenuItem>
            <MenuItem value='name'>Name</MenuItem>
            <MenuItem value='creation'>Creation Time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ my: 2 }}>Pages</Divider>

      <Grid container spacing={2}>
        {sortedPages.map(page => (
          <Grid item xs={12} sm={6} md={4} key={page.PageID}>
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
