import { useParams } from 'react-router-dom';
import { Typography, Box } from '@mui/material';

export default function Pages() {
  const { project_id } = useParams();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Pages for Project {project_id}
      </Typography>
      <Typography variant="body1">This is where project pages will be managed.</Typography>
    </Box>
  );
}
