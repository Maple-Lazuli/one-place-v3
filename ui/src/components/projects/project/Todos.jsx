import { useParams } from 'react-router-dom';
import { Typography, Box } from '@mui/material';

export default function Todos() {
  const { project_id } = useParams();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Todos for Project {project_id}
      </Typography>
      <Typography variant="body1">This is where you can view and manage project tasks.</Typography>
    </Box>
  );
}
