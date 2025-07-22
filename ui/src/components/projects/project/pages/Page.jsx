import { useParams, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Typography, Container, Paper, Tabs, Tab, Box } from '@mui/material'

export default function Page () {
  const { project_id, page_id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const navLinks = [
    { label: 'Content', path: '' },
    { label: 'Editor', path: 'editor' },
    { label: 'Code Snippets', path: 'snippets' },
    { label: 'Equations', path: 'equations' },
    { label: 'Canvases', path: 'canvases' },
    { label: 'Files', path: 'files' },
    { label: 'Translations', path: 'translations' }
  ]

  const currentPathSegment = location.pathname.split('/').pop()
  const currentTabIndex = navLinks.findIndex(
    link => link.path === currentPathSegment
  )
  const tabIndex = currentTabIndex === -1 ? 0 : currentTabIndex

  const handleChange = (event, newValue) => {
    const selectedPath = navLinks[newValue].path
    navigate(
      `/projects/project/${project_id}/pages/page/${page_id}/${selectedPath}`
    )
  }

  return (
    <Container
      maxWidth={false}
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        p: 2
      }}
    >
      <Typography variant='h5' fontWeight='bold' sx={{ mb: 2, flexShrink: 0 }}>
        Page {page_id}
      </Typography>

      <Tabs
        value={tabIndex}
        onChange={handleChange}
        textColor='primary'
        indicatorColor='primary'
        sx={{ mb: 2, flexShrink: 0 }}
        variant='scrollable'
        scrollButtons='auto'
        allowScrollButtonsMobile
      >
        {navLinks.map(({ label }) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>

      <Paper
        elevation={1}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          minHeight: 0 // important for flexbox scroll containment
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'hidden',
            minHeight: 0, // important for scroll containment inside flexbox
            maxHeight: '80vh' // limit height to viewport
          }}
        >
          <Outlet />
        </Box>
      </Paper>
    </Container>
  )
}
