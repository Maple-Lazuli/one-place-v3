import { useParams, Link } from 'react-router-dom'
import { Typography, Box, Button, Divider, Grid } from '@mui/material'
import { useEffect, useState } from 'react'
import CanvasCard from './CanvasCard'

export default function PageCanvases () {
  const { project_id, page_id } = useParams()
  const [canvases, setCanvases] = useState([])

  useEffect(() => {
    let intervalId
    async function fetchCanvases () {
      const res = await fetch(`/api/canvas/get_all_by_page?id=${page_id}`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (data.status === 'success') {
        setCanvases(data.message)
      }
    }

    fetchCanvases()

    intervalId = setInterval(fetchCanvases, 5000)

    return () => clearInterval(intervalId)
  }, [page_id])

  const handleDelete = deletedId => {
    setCanvases(prev => prev.filter(canvas => canvas.CanvasID !== deletedId))
  }

  const sortedCanvases = [...canvases].sort(
    (a, b) => b.lastEditTime - a.lastEditTime
  )

  return (
    <Box sx={{ p: 2, maxHeight: '80vh', overflowY: 'auto' }}>
      <Button
        component={Link}
        to={`/projects/project/${project_id}/pages/page/${page_id}/canvases/start`}
        variant='contained'
        sx={{ mb: 3 }}
      >
        Start New Canvas
      </Button>
      <Divider sx={{ my: 2 }}>Canvases</Divider>
      <Grid container spacing={2}>
        {sortedCanvases.map(canvas => (
          <Grid key={canvas.CanvasID}>
            <CanvasCard
              name={canvas.name}
              description={canvas.description}
              canvas_id={canvas.CanvasID}
              updated={canvas.lastEditTime}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
