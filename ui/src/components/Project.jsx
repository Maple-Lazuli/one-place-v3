import { useState } from 'react'
import { useParams, Link, Outlet } from 'react-router-dom'
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'

export default function Project () {
  const { project_id } = useParams()
  const [open, setOpen] = useState(false)

  const toggleSidebar = () => setOpen(!open)

  const links = [
    { label: 'Overview', path: '' },
    { label: 'Pages', path: `pages` },
    { label: 'Todos', path: `todos` },
    { label: 'Events', path: `events` },
    { label: 'All Code Snippets', path: `snippets` },
    { label: 'All Canvases', path: `canvases` },
    { label: 'All Attachments', path: `attachments` }
  ]

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar toggle button */}
      <Box sx={{ p: 2 }}>
        <IconButton onClick={toggleSidebar}>
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Sidebar */}
      {open && (
        <Box
          sx={{
            width: 250,
            p: 2,
            borderRight: '1px solid #ddd',
            bgcolor: 'background.paper',
            flexShrink: 0
          }}
        >
          <Typography variant='h6' sx={{ mb: 2 }}>
            Project {project_id}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {links.map(item => (
              <ListItem
                key={item.label}
                button
                component={Link}
                to={`/projects/project/${project_id}/${item.path}`}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant='h4' gutterBottom>
          Project {project_id}
        </Typography>
        <Outlet />
      </Box>
    </Box>
  )
}
