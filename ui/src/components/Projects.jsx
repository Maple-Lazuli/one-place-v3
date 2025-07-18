import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import Container from '@mui/material/Container'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import ProjectCard from './ProjectCard'


export default function Projects () {
  const [projects, setProjects] = useState([])
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/get_all`, {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Unauthorized or failed request')
        }
        return res.json()
      })
      .then(data => {
        if (data.status === 'success') {
          const projectList = data.message
          if (!projectList || projectList.length === 0) {
            setError('No projects found.')
            setProjects([])
            setOpen(true)
          } else {
            setProjects(projectList)
            setError('')
            setOpen(false)
          }
        } else {
          setError(data.message || 'Failed to fetch projects')
          setProjects([])
          setOpen(true)
        }
      })
      .catch(err => {
        setError(err.message || 'Network error')
        setProjects([])
        setOpen(true)
      })
  }, [])

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return
    setOpen(false)
  }

  return (
    <Container sx={{ py: 4 }}>
      <Link to='/projects/create' style={{ textDecoration: 'none' }}>
        <Button variant='contained' sx={{ mb: 2 }}>
          Create New Project
        </Button>
      </Link>

      <Typography variant='h4' gutterBottom>
        Projects
      </Typography>

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

      {projects.length === 0 && !open ? (
        <Typography>
          No projects available. Create one to get started.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {projects.map(p => (
            <Grid
              item
              xs={4}
              key={p.id || p.name}
              sx={{ display: 'flex', height: '100%', minWidth: 0 }}
            >
              <ProjectCard
                name={p.name}
                description={p.description}
                sx={{
                  flexGrow: 1,
                  width: 400,
                  height:200,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}
