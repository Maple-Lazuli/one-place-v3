import React from 'react'
import { Slider, Box, Typography } from '@mui/material'

export default function CanvasScaleControl({ scale, setScale, min = 0.01, max = 5 }) {
  const handleChange = (_, newValue) => {
    setScale(newValue)
  }

  return (
    <Box width={200} px={2}>
      <Typography variant="caption">Zoom</Typography>
      <Slider
        value={scale}
        onChange={handleChange}
        min={min}
        max={max}
        step={0.1}
        aria-label="Canvas Zoom"
      />
      <Typography variant="caption">{(scale * 100).toFixed(0)}%</Typography>
    </Box>
  )
}