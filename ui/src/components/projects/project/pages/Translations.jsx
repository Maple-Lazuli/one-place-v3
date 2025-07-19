import { useParams, Link } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  Grid
} from '@mui/material'
import { useEffect, useState } from 'react'
import TranslationCard from './TranslationCard'

export default function PageTranslations () {
  const {project_id,  page_id } = useParams()
  const [translations, setTranslations] = useState([])

  useEffect(() => {
    async function fetchTranslations() {
      const res = await fetch(`/api/translations/get_all_by_page?id=${page_id}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.status === 'success') {
        setTranslations(data.message)
      }
    }

    fetchTranslations()
  }, [page_id])

  const handleDelete = (deletedId) => {
    setTranslations((prev) => prev.filter((translation) => translation.TranslationID !== deletedId))
  }


  const sortedTranslations = [...translations]
    .sort((a, b) => b.lastEditTime - a.lastEditTime)

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Translations for Page {page_id}
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Translations Stuff
      </Typography>

      <Button
        component={Link}
        to={`/projects/project/${project_id}/pages/page/${page_id}/translations/start`}
        variant="contained"
        sx={{ mb: 3 }}
      >
        Start New Translation
      </Button>

      <Typography variant="h6" gutterBottom>Translations</Typography>
      <Grid container spacing={2}>
        {sortedTranslations.map((translation) => (
          <Grid key={translation.TranslationID}>
            <TranslationCard
              language={translation.language}
              translation_id={translation.TranslationID}
              updated={translation.lastEditTime}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
