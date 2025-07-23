import { useParams, Link } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  Grid
} from '@mui/material'
import { useEffect, useState } from 'react'
import RecipeCard from './RecipeCard'

export default function PageRecipes () {
  const {project_id,  page_id } = useParams()
  const [recipes, setRecipes] = useState([])

  useEffect(() => {
    async function fetchRecipes() {
      const res = await fetch(`/api/recipes/get_all_by_page?id=${page_id}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.status === 'success') {
        setRecipes(data.message)
      }
    }

    fetchRecipes()
  }, [page_id])

  const handleDelete = (deletedId) => {
    setRecipes((prev) => prev.filter((recipe) => recipe.RecipeID !== deletedId))
  }


  const sortedRecipes = [...recipes]
    .sort((a, b) => b.lastEditTime - a.lastEditTime)

  return (
    <Box sx={{ p: 2, maxHeight: '80vh', overflowY: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Recipes for Page {page_id}
      </Typography>

      <Typography variant="body1" sx={{ mb: 2, overflowY: 'auto' }}>
        Recipes Stuff
      </Typography>

      <Button
        component={Link}
        to={`/projects/project/${project_id}/pages/page/${page_id}/recipes/create`}
        variant="contained"
        sx={{ mb: 3 }}
      >
        Create New Recipe
      </Button>

      <Typography variant="h6" gutterBottom>Recipes</Typography>
      <Grid container spacing={2}>
        {sortedRecipes.map((recipe) => (
          <Grid key={recipe.RecipeID}>
            <RecipeCard
              name={recipe.name}
              description={recipe.description}
              recipe_id={recipe.RecipeID}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
