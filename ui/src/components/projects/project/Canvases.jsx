import { useParams, Link } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  Divider,
  Grid
} from '@mui/material'
import { useEffect, useState } from 'react'
import CanvasCard from './pages/CanvasCard'

export default function Canvases () {
  const {project_id } = useParams()
  const [canvases, setCanvases] = useState([])

  useEffect(() => {
    let intervalId
    async function fetchCanvases() {
      const res = await fetch(`/api/canvas/get_all_by_project?id=${project_id}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.status === 'success') {
        setCanvases(data.message)
      }
    }

    fetchCanvases()

    intervalId = setInterval(fetchCanvases, 5000)

    return () => clearInterval(intervalId)
  }, [project_id])

  const handleDelete = (deletedId) => {
    setCanvases((prev) => prev.filter((canvas) => canvas.CanvasID !== deletedId))
  }


  const sortedCanvases = [...canvases]
    .sort((a, b) => b.lastEditTime - a.lastEditTime)

  return (
    <Box sx={{ p: 2, height: '100%', overflowY:'auto' }}>
      <Typography variant="h5" gutterBottom>
      All Project Canvases
      </Typography>

 <Divider sx={{ my: 2 }}>Canvases</Divider>
      <Grid container spacing={2}>
        {sortedCanvases.map((canvas) => (
          <Grid key={canvas.CanvasID}>
            <CanvasCard
              name={canvas.name}
              description={canvas.description}
              canvas_id={canvas.CanvasID}
              updated={canvas.lastEditTime}
              onDelete={handleDelete}
              passed_page_id={canvas.pageID}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
