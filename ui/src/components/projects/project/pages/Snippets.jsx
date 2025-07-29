import { useParams, Link } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  Divider,
  Grid
} from '@mui/material'
import { useEffect, useState } from 'react'
import SnippetCard from './SnippetCard'

export default function PageSnippets() {
  const {project_id,  page_id } = useParams()
  const [snippets, setSnippets] = useState([])

  useEffect(() => {
    let intervalId
    async function fetchSnippets() {
      const res = await fetch(`/api/code_snippet/get_all_by_page?id=${page_id}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.status === 'success') {
        setSnippets(data.message)
      }
    }

    fetchSnippets()

    intervalId = setInterval(fetchSnippets, 5000)

    return () => clearInterval(intervalId)
  }, [page_id])

  const handleDelete = (deletedId) => {
    setSnippets((prev) => prev.filter((snippet) => snippet.CodeID !== deletedId))
  }


  const sortedSnippets = [...snippets]
    .sort((a, b) => b.lastEditTime - a.lastEditTime)

  return (
    <Box sx={{ p: 2, maxHeight: '80vh', overflowY: 'auto' }}>

      <Button
        component={Link}
        to={`/projects/project/${project_id}/pages/page/${page_id}/snippets/create`}
        variant="contained"
        sx={{ mb: 3 }}
      >
        Create New Snippet
      </Button>

      <Divider sx={{ my: 2 }}>Code Snippets</Divider>
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
