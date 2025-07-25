import { useState, useEffect } from 'react'
import { useParams, Link, Outlet, useMatch } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Divider,
  IconButton,
  Drawer,
  Stack
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import MenuIcon from '@mui/icons-material/Menu'

export default function Project () {
  const { project_id } = useParams()
  const match = useMatch('/projects/project/:project_id/')
  const [drawerOpen, setDrawerOpen] = useState(!!match)
  const [projectName, setProjectName] = useState('')

  useEffect(() => {
    async function fetchProjectName () {
      try {
        const res = await fetch(`/api/projects/get?id=${project_id}`)
        const data = await res.json()
        if (data.message.name) {
          setProjectName(data.message.name)
        } else {
          setProjectName(`Project ${project_id}`)
        }
      } catch (err) {
        console.error('Error fetching project name:', err)
        setProjectName(`Project ${project_id}`)
      }
    }

    if (project_id) fetchProjectName()
  }, [project_id])

  const links = [
    { label: 'Overview', path: 'overview' },
    { label: 'Calendar', path: 'calendar' },
    { label: 'Pages', path: 'pages' },
    { label: 'Todos', path: 'todos' },
    { label: 'Events', path: 'events' },
    { label: 'All Code Snippets', path: 'snippets' },
    { label: 'All Recipes', path: 'recipes' },
    { label: 'All Equations', path: 'equations' },
    { label: 'All Canvases', path: 'canvases' },
    { label: 'All Attachments', path: 'attachments' }
  ]

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        width: '100%'
      }}
    >
      {/* Top bar with toggle */}
      <IconButton
        onClick={() => setDrawerOpen(!drawerOpen)}
        sx={{
          position: 'fixed',
          top: 8,
          left: 8,
          zIndex: 1301,
          color: 'primary.contrastText',
          animation: 'flash 0.5s ease-in-out 2',
          '@keyframes flash': {
            '0%': { opacity: 1 },
            '50%': { opacity: 0.2 },
            '100%': { opacity: 1 }
          }
        }}
      >
        {drawerOpen ? <CloseIcon /> : <MenuIcon />}
      </IconButton>

      {/* Sidebar Drawer */}
      <Drawer
        variant='temporary'
        anchor='left'
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{
          keepMounted: true
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 440,
            boxSizing: 'border-box',
            p: 2,
            pt: '4vh'
          }
        }}
      >
        <Typography variant='h6' gutterBottom>
          {projectName}
        </Typography>
        <Divider
          sx={{ borderColor: 'text.primary', borderBottomWidth: 2, mb: 2 }}
        />
        <Stack spacing={1}>
          {links.map(link => (
            <Button
              key={link.label}
              component={Link}
              to={`/projects/project/${project_id}/${link.path}`}
              variant='text'
              sx={{
                justifyContent: 'flex-start',
                fontWeight: 'medium',
                color: 'text.primary',
                '&:hover': { bgcolor: 'primary.dark' },
                textTransform: 'none'
              }}
              fullWidth
            >
              {link.label}
            </Button>
          ))}
        </Stack>
      </Drawer>

      {/* Main Content */}
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          p: 3,
          boxSizing: 'border-box',
          overflow: 'hidden',
          ml: drawerOpen ? '240px' : 0,
          transition: 'margin-left 0.3s',
          height: '95vh',
          width: '98vw'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
