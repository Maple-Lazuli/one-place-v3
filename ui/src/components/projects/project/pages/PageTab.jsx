import { Tabs, Tab } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'

export default function PageTabs() {
  const { project_id, page_id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // Find index of current tab based on path
  const currentPath = location.pathname.split('/').pop() || ''
  const currentIndex = navLinks.findIndex(link => link.path === currentPath)

  const handleChange = (event, newValue) => {
    navigate(`/projects/project/${project_id}/pages/page/${page_id}/${navLinks[newValue].path}`)
  }

  return (
    <Tabs
      value={currentIndex === -1 ? 0 : currentIndex}
      onChange={handleChange}
      textColor="primary"
      indicatorColor="primary"
      sx={{ mb: 3 }}
    >
      {navLinks.map(({ label }) => (
        <Tab key={label} label={label} />
      ))}
    </Tabs>
  )
}
