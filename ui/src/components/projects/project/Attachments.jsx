import { useParams } from 'react-router-dom';
import { Typography, Box } from '@mui/material';

export default function Attachments() {
  const { project_id } = useParams();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Attachments for Project {project_id}
      </Typography>
      <Typography variant="body1">Upload or view files related to this project.</Typography>
    </Box>
  );
}
