import React from 'react'
import { Card, CardContent, Typography, Box } from '@mui/material'

export default function EventCard({ name, date, description }) {
  const formattedDate = new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Card sx={{ maxWidth: 400, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {name}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {formattedDate}
        </Typography>
        <Box sx={{ whiteSpace: 'pre-line' }}>
          <Typography variant="body2" color="text.primary">
            {description}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
