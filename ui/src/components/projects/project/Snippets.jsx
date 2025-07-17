import { useParams } from 'react-router-dom';
import { Typography, Box } from '@mui/material';

export default function Snippets() {
  const { project_id } = useParams();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Code Snippets for Project {project_id}
      </Typography>
      <Typography variant="body1">Code Snippets</Typography>
    </Box>
  );
}
