import { useParams, Link } from 'react-router-dom'
import { Typography, Box, Button, Grid } from '@mui/material'
import { useEffect, useState } from 'react'
import FileCard from './FileCard'

export default function PageFiles () {
  const { project_id, page_id } = useParams()
  const [files, setFiles] = useState([])

  useEffect(() => {
    async function fetchFiles () {
      const res = await fetch(`/api/files/files_by_page?page_id=${page_id}`, {
        credentials: 'include'
      })
      const data = await res.json()
      setFiles(data)
    }

    fetchFiles()
  }, [page_id])

  const handleDelete = deletedId => {
    setFiles(prev => prev.filter(file => file.FileID !== deletedId))
  }

  const sortedFiles = [...files].sort((a, b) => b.upload_date - a.upload_date)

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant='h5' gutterBottom>
        Files for Page {page_id}
      </Typography>

      <Typography variant='body1' sx={{ mb: 2 }}>
        Files Stuff
      </Typography>

      <Button
        component={Link}
        to={`/projects/project/${project_id}/pages/page/${page_id}/files/upload`}
        variant='contained'
        sx={{ mb: 3 }}
      >
        Upload New File
      </Button>

      <Typography variant='h6' gutterBottom>
        Files
      </Typography>
      <Grid container spacing={2}>
        {sortedFiles.map(file => (
          <Grid key={file.FileID}>
            <FileCard
              name={file.name}
              description={file.description}
              filename={file.filename}
              upload_date={file.upload_date}
              file_id={file.FileID}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
