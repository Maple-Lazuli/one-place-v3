import { useParams, Link } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  Grid
} from '@mui/material'
import { useEffect, useState } from 'react'
import EquationCard from './EquationCard'

export default function PageEquations () {
  const {project_id,  page_id } = useParams()
  const [equations, setEquations] = useState([])

  useEffect(() => {
    async function fetchEquations() {
      const res = await fetch(`/api/equations/get_all_by_page?id=${page_id}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.status === 'success') {
        setEquations(data.message)
      }
    }

    fetchEquations()
  }, [page_id])

  const handleDelete = (deletedId) => {
    setEquations((prev) => prev.filter((equation) => equation.EquationID !== deletedId))
  }


  const sortedEquations = [...equations]
    .sort((a, b) => b.lastEditTime - a.lastEditTime)

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Equations for Page {page_id}
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Equations Stuff
      </Typography>

      <Button
        component={Link}
        to={`/projects/project/${project_id}/pages/page/${page_id}/equations/create`}
        variant="contained"
        sx={{ mb: 3 }}
      >
        Create New Equation
      </Button>

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
