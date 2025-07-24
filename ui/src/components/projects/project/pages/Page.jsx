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
    { label: 'Recipes', path: 'recipes' },
    { label: 'Equations', path: 'equations' },
    { label: 'Canvases', path: 'canvases' },
    { label: 'Files', path: 'files' },
    { label: 'Translations', path: 'translations' }
  ]

  // Get the path after .../page/:page_id/
  const basePath = `/projects/project/${project_id}/pages/page/${page_id}/`
  const subPath = location.pathname.startsWith(basePath)
    ? location.pathname.slice(basePath.length).split('/')[0]
    : ''

  const currentTabIndex = navLinks.findIndex(link => link.path === subPath)
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
      <Typography variant='h5' fontWeight='bold' sx={{ mb: 1, flexShrink: 0 }}>
        Page {page_id}
      </Typography>

<Tabs
  value={tabIndex}
  onChange={handleChange}
  textColor="inherit"
  indicatorColor="primary"
  sx={{ mb: 1, flexShrink: 0 }}
  variant="scrollable"
  scrollButtons="auto"
  allowScrollButtonsMobile
>
  {navLinks.map(({ label }) => (
    <Tab
      key={label}
      label={label}
      sx={{
        color: 'text.primary',
        '&.Mui-selected': {
          color: 'primary.main',
          fontWeight: 'bold',
        },
        '&:hover': {
          color: 'primary.light',
        },
        '&:focus': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: '2px',
        },
      }}
    />
  ))}
</Tabs>

      <Paper
        elevation={1}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 1,
          minHeight: 0,
          boxShadow: 10
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'hidden',
            minHeight: 0,
            maxHeight: '95vh'
          }}
        >
          <Outlet />
        </Box>
      </Paper>
    </Container>
  )
}
