import React from 'react'
import { Box, Typography, IconButton, Tooltip } from '@mui/material'
import RemoveIcon from '@mui/icons-material/Remove'
import AddIcon from '@mui/icons-material/Add'

export default function StrokeSizeStepper({ strokeWidth, setStrokeWidth }) {
  const MIN = .5
  const MAX = 60

  const decrease = () => {
    setStrokeWidth(prev => Math.max(MIN, prev - 1))
  }

  const increase = () => {
    setStrokeWidth(prev => Math.min(MAX, prev + 1))
  }

  return (
<Box
  display="flex"
  alignItems="center"
  gap={1}
  sx={(theme) => ({
    color: theme.palette.primary,

    // Typography inside uses the theme text color
    '& .MuiTypography-root': {
      color: theme.palette.primary,
    },

    // IconButtons (icons) color
    '& .MuiIconButton-root': {
      color: theme.palette.primary,
    },
  })}
>
  <Typography>Size:</Typography>

  <Tooltip title="Decrease Size">
    <IconButton onClick={decrease} size="small">
      <RemoveIcon />
    </IconButton>
  </Tooltip>

  {/* Preview dot */}
  <Box
    sx={{
      width: 30,
      height: 30,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Box
      sx={{
        width: strokeWidth,
        height: strokeWidth,
        borderRadius: '50%',
        backgroundColor: '#1976d2', // You could also set this from theme.palette.primary.main if you want
        border: '0px solid #ccc',
      }}
    />
  </Box>

  {/* Size value */}
  <Typography sx={{ minWidth: 24, textAlign: 'center' }}>
    {strokeWidth}
  </Typography>

  <Tooltip title="Increase Size">
    <IconButton onClick={increase} size="small">
      <AddIcon />
    </IconButton>
  </Tooltip>
</Box>

  )
}
