import { useParams, Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Container,
  Paper,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { useState, useEffect } from 'react'

export default function Page() {
  const { project_id, page_id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navLinks = [
    { label: 'Content', path: '' },
    { label: 'Editor', path: 'editor' },
    { label: 'Snippets', path: 'snippets' },
    { label: 'Translations', path: 'translations' },
    { label: 'Canvases', path: 'canvases' },
    { label: 'Files', path: 'files' }
  ]

  // Helper to get current tab index from URL
  // Get last segment of path after page_id
  // Example: /projects/project/1/pages/page/5/editor => 'editor'
  const currentPathSegment = location.pathname.split('/').pop()

  // Find tab index that matches current path segment
  const currentTabIndex = navLinks.findIndex(link => link.path === currentPathSegment)

  // If no match (e.g. path segment is page_id), default to 0
  const tabIndex = currentTabIndex === -1 ? 0 : currentTabIndex

  const handleChange = (event, newValue) => {
    const selectedPath = navLinks[newValue].path
    navigate(`/projects/project/${project_id}/pages/page/${page_id}/${selectedPath}`)
  }

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return
    }
    setDrawerOpen(open)
  }

  return (
    <Container maxWidth={false} sx={{ height: '100%', p: 0, m: 0 }}>
      {/* AppBar with menu icon and page title */}
          <Typography variant="h5" fontWeight="bold" component="div" sx={{ flexShrink: 0 }}>
            Page {page_id}
          </Typography>

      {/* Tabs for navigation */}
      <Tabs
        value={tabIndex}
        onChange={handleChange}
        textColor="primary"
        indicatorColor="primary"
        sx={{ mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        {navLinks.map(({ label }) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>

      {/* Content Outlet */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Outlet />
      </Paper>
    </Container>
  )
}
