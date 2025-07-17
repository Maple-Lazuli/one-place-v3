import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

export default function ProjectCard ({ name, description, sx }) {
  return (
    <Card
      sx={{
        width: 400,
        height: 200,
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        ...sx
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant='h6' gutterBottom>
          {name}
        </Typography>
        <Typography variant='body2'>{description}</Typography>
      </CardContent>
    </Card>
  )
}
