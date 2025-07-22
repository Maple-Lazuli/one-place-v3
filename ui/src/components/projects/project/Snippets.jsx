import { useParams, Link } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  Grid
} from '@mui/material'
import { useEffect, useState } from 'react'
import SnippetCard from './pages/SnippetCard'

export default function Snippets() {
  const {project_id } = useParams()
  const [snippets, setSnippets] = useState([])

  useEffect(() => {
    async function fetchSnippets() {
      const res = await fetch(`/api/code_snippet/get_all_by_project?id=${project_id}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.status === 'success') {
        setSnippets(data.message)
      }
    }

    fetchSnippets()
  }, [project_id])

  const handleDelete = (deletedId) => {
    setSnippets((prev) => prev.filter((snippet) => snippet.CodeID !== deletedId))
  }


  const sortedSnippets = [...snippets]
    .sort((a, b) => b.lastEditTime - a.lastEditTime)

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Snippets for Rpa
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Snippet Stuff
      </Typography>

      <Typography variant="h6" gutterBottom>Snippets</Typography>
      <Grid container spacing={2}>
        {sortedSnippets.map((snippet) => (
          <Grid key={snippet.CodeID}>
            <SnippetCard
              name={snippet.name}
              language={snippet.language}
              description={snippet.description}
              code_id={snippet.CodeID}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
