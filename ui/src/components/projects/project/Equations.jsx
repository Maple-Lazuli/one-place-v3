import { useParams } from 'react-router-dom';
import { Typography, Box } from '@mui/material';

export default function Equations() {
  const { project_id } = useParams();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Equations for Project {project_id}
      </Typography>
      <Typography variant="body1">Code Snippets</Typography>
    </Box>
  );
}
