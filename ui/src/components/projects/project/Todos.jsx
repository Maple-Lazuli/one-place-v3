import { useParams, Link } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  Grid
} from '@mui/material'
import { useEffect, useState } from 'react'
import TodoCard from './TodoCard'

export default function Todos() {
  const { project_id } = useParams()
  const [todos, setTodos] = useState([])

  useEffect(() => {
    async function fetchTodos() {
      const res = await fetch(`/api/events/get_project_todo?project_id=${project_id}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.status === 'success') {
        setTodos(data.message)
      }
    }

    fetchTodos()
  }, [project_id])

  const handleDelete = (deletedId) => {
    setEvents((prev) => prev.filter((todo) => todo.TodoId !== deletedId))
  }

  const now = Date.now() / 1000 // current UNIX timestamp in seconds

  const pendingTodo = [...todos]
    .filter((t) => t.completed === false)

  const completedTodo = [...todos]
    .filter((t) => t.completed)

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Todos for Project {project_id}
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Track or create todos associated with this project.
      </Typography>

      <Button
        component={Link}
        to={`/projects/project/${project_id}/todo/create`}
        variant="contained"
        sx={{ mb: 3 }}
      >
        Create New Tdo
      </Button>

      <Typography variant="h6" gutterBottom>Pending Todos</Typography>
      <Grid container spacing={2}>
        {pendingTodo.map((todo) => (
          <Grid key={todo.TodoID} item xs={12} sm={6} md={4}>
            <EventCard
              name={todo.name}
              date={todo.dueTime}
              description={todo.description}
              todo_id={todo.TodoID}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Completed Todos</Typography>
      <Grid container spacing={2}>
        {completedTodo.map((todo) => (
          <Grid key={todo.TodoID} item xs={12} sm={6} md={4}>
            <EventCard
              name={todo.name}
              date={todo.dueTime}
              description={todo.description}
              todo_id={todo.TodoID}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
