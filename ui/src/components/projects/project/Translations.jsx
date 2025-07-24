import { useParams } from 'react-router-dom';
import { Typography, Box } from '@mui/material';

export default function Translations() {
  const { project_id } = useParams();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Translations
      </Typography>
      <Typography variant="body1">Translations for the project</Typography>
    </Box>
  );
}
