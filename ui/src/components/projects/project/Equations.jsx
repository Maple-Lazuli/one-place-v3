import { useParams, Link } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  Grid
} from '@mui/material'
import { useEffect, useState } from 'react'
import EquationCard from './pages/EquationCard'

export default function Equations () {
  const {project_id } = useParams()
  const [equations, setEquations] = useState([])

  useEffect(() => {
    async function fetchEquations() {
      const res = await fetch(`/api/equations/get_all_by_project?id=${project_id}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.status === 'success') {
        setEquations(data.message)
      }
    }

    fetchEquations()
  }, [project_id])

  const handleDelete = (deletedId) => {
    setEquations((prev) => prev.filter((equation) => equation.EquationID !== deletedId))
  }


  const sortedEquations = [...equations]
    .sort((a, b) => b.lastEditTime - a.lastEditTime)

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Equations for Project
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Equations Stuff
      </Typography>

      <Typography variant="h6" gutterBottom>Equations</Typography>
      <Grid container spacing={2}>
        {sortedEquations.map((equation) => (
          <Grid key={equation.EquationID}>
            <EquationCard
              name={equation.name}
              description={equation.description}
              equation_id={equation.EquationID}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
