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
      const res = await fetch(`/api/todo/get_project_todo?project_id=${project_id}`, {
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
    setTodos((prev) => prev.filter((todo) => todo.TodoID !== deletedId))
  }

    const handleComplete = (completedTodoId) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.TodoID === completedTodoId ? { ...todo, completed: true, timeCompleted: Math.floor(Date.now() / 1000) } : todo
      )
    )
  }

const now = Math.floor(Date.now() / 1000)
const in24Hours = now + 24 * 60 * 60

  const getBorderColor = (dueTime) => {
  if (!dueTime) return undefined 

  if (dueTime < now) return 'red' 
  if (dueTime >= now && dueTime <= in24Hours) return 'orange' 

  return undefined 
}

  const pendingTodo = [...todos]
    .filter((t) => !t.completed)
    .sort((a, b) => {
      if (!a.dueTime) return 1
      if (!b.dueTime) return -1
      return a.dueTime - b.dueTime
    })

  const completedTodo = [...todos]
    .filter((t) => t.completed)
    .sort((a, b) => {
      if (!a.timeCompleted) return 1
      if (!b.timeCompleted) return -1
      return b.timeCompleted - a.timeCompleted
    })

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
        to={`/projects/project/${project_id}/todos/create`}
        variant="contained"
        sx={{ mb: 3 }}
      >
        Create New Todo
      </Button>

      <Typography variant="h6" gutterBottom>Pending Todos</Typography>
      <Grid container spacing={2}>
        {pendingTodo.map((todo) => (
          <Grid key={todo.TodoID}>
            <TodoCard
              name={todo.name}
              date={todo.dueTime}
              description={todo.description}
              todo_id={todo.TodoID}
              onDelete={handleDelete}
              onComplete={handleComplete} 
              borderColor={getBorderColor(todo.dueTime)} 
            />
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Completed Todos</Typography>
      <Grid container spacing={2}>
        {completedTodo.map((todo) => (
          <Grid key={todo.TodoID}>
            <TodoCard
              name={todo.name}
              date={todo.dueTime}
              description={todo.description}
              todo_id={todo.TodoID}
              onDelete={handleDelete}
              isPast={true}
              completedTime={todo.timeCompleted}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
