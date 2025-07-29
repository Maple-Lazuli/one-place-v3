import { useParams, Link } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  Divider,
  Grid
} from '@mui/material'
import { useEffect, useState } from 'react'
import RecipeCard from './pages/RecipeCard'

export default function Recipes () {
  const {project_id } = useParams()
  const [recipes, setRecipes] = useState([])

  useEffect(() => {
    let intervalId
    async function fetchRecipes() {
      const res = await fetch(`/api/recipes/get_all_by_project?id=${project_id}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.status === 'success') {
        setRecipes(data.message)
      }
    }

    fetchRecipes()

    intervalId = setInterval(fetchRecipes, 5000)

    return () => clearInterval(intervalId)
  }, [project_id])

  const handleDelete = (deletedId) => {
    setRecipes((prev) => prev.filter((recipe) => recipe.RecipeID !== deletedId))
  }


  const sortedRecipes = [...recipes]
    .sort((a, b) => b.lastEditTime - a.lastEditTime)

  return (
    <Box sx={{ p: 2, height: '100%', overflowY:'auto' }}>
      <Typography variant="h5" gutterBottom>
        All Project Recipes
      </Typography>

      <Divider sx={{ my: 2 }}>Recipes</Divider>
      <Grid container spacing={2}>
        {sortedRecipes.map((recipe) => (
          <Grid key={recipe.RecipeID}>
            <RecipeCard
              name={recipe.name}
              description={recipe.description}
              recipe_id={recipe.RecipeID}
              onDelete={handleDelete}
              passed_page_id={recipe.pageID}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
