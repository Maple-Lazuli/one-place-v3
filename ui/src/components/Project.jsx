import { useState } from 'react'
import { useParams, Link, Outlet } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Stack
} from '@mui/material'

export default function Project() {
  const { project_id } = useParams()

  const links = [
    { label: 'Calendar', path: '' },
    { label: 'Pages', path: 'pages' },
    { label: 'Todos', path: 'todos' },
    { label: 'Events', path: 'events' },
    { label: 'All Code Snippets', path: 'snippets' },
    { label: 'All Canvases', path: 'canvases' },
    { label: 'All Attachments', path: 'attachments' }
  ]

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 240,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: 2
        }}
      >
        <Typography variant="h6" gutterBottom>
          Project {project_id}
        </Typography>
        <Divider sx={{ borderColor: 'primary.contrastText', mb: 2 }} />
        <Stack spacing={1}>
          {links.map(link => (
            <Button
              key={link.label}
              component={Link}
              to={`/projects/project/${project_id}/${link.path}`}
              variant="text"
              sx={{
                justifyContent: 'flex-start',
                fontWeight: 'medium',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
                textTransform: 'none'
              }}
              fullWidth
            >
              {link.label}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,       // take all remaining horizontal space
          p: 3,             // padding inside main content
          overflow: 'auto',  // scroll if content overflows vertically
          height: '100vh',   // fill full height
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
