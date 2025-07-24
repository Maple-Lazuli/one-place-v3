import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'

export default function StartTranslationForm () {
  const maxLanguageCharLimit = 64

  const [language, setLanguage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { project_id, page_id } = useParams()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    setLoading(true)

    try {
      const payload = {
        page_id: Number(page_id),
        language: language
      }

      const res = await fetch('/api/translations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      })

      let data = {}
      try {
        data = await res.json()
      } catch {}

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create Translation.')
      }

      setSuccess(data.message || 'Translation created successfully!')
      setTimeout(() => {
        navigate(
          `/projects/project/${project_id}/pages/page/${page_id}/translations`
        )
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 4,
        mt: 4,
        alignItems: 'flex-start',
        width: '20%',
        px: 2
      }}
    >
      {/* FORM */}
      <Box
        component='form'
        onSubmit={handleSubmit}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Typography variant='h5' component='h2' gutterBottom>
          Start New Translation
        </Typography>

        {error && <Alert severity='error'>{error}</Alert>}
        {success && <Alert severity='success'>{success}</Alert>}

        <TextField
          label='Language'
          value={language}
          onChange={e => setLanguage(e.target.value)}
          required
          inputProps={{ maxLength: maxLanguageCharLimit }}
          helperText={`${language.length}/${maxLanguageCharLimit} characters`}
          error={language.length > maxLanguageCharLimit}
        />

        <Button variant='contained' type='submit' disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Create Translation'}
        </Button>
      </Box>
    </Box>
  )
}
