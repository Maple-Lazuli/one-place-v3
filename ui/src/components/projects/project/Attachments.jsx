import { useParams, Link } from 'react-router-dom'
import { Typography, Box, Button,Divider, Grid } from '@mui/material'
import { useEffect, useState } from 'react'
import FileCard from './pages/FileCard'

export default function Attachments () {
  const { project_id } = useParams()
  const [files, setFiles] = useState([])

  useEffect(() => {
    async function fetchFiles () {
      const res = await fetch(`/api/files/files_by_project?id=${project_id}`, {
        credentials: 'include'
      })
      const data = await res.json()
      setFiles(data)
    }

    fetchFiles()
  }, [project_id])

  const handleDelete = deletedId => {
    setFiles(prev => prev.filter(file => file.FileID !== deletedId))
  }

  const sortedFiles = [...files].sort((a, b) => b.upload_date - a.upload_date)

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant='h5' gutterBottom>
        All Project Files
      </Typography>
 <Divider sx={{ my: 2 }}>Uploads</Divider>
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
