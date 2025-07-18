import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Todo from './components/Todo'
import MarkdownEditor from './components/MarkdownEditor'
import Login from './components/Login'
import CreateAccount from './components/CreateAccount'
import Home from './components/Home'
import NavigationBar from './components/NavigationBar'
import Projects from './components/Projects'
import CreateProject from './components/CreateProject'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import Project from './components/Project'
import CssBaseline from '@mui/material/CssBaseline'
import Pages from './components/projects/project/Pages'
import Todos from './components/projects/project/Todos'
import Attachments from './components/projects/project/Attachments'
import Events from './components/projects/project/Events'
import Snippets from './components/projects/project/Snippets'
import Canvases from './components/projects/project/Canvases'
import Translations from './components/projects/project/Translations'
import CreateEventForm from './components/projects/project/CreateEventForm'
import UpdateEventForm from './components/projects/project/UpdateEventForm'
import CreateTodoForm from './components/projects/project/CreateTodoForm'
import UpdateTodoForm from './components/projects/project/UpdateTodoForm'
import EditProject from './components/UpdateProject'
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  }
})

export default function App () {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalize and reset styles */}
      <Router>
        <NavigationBar />
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='/todo' element={<Todo />} />
          <Route path='/notes' element={<MarkdownEditor />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<CreateAccount />} />
          <Route path='/Home' element={<Home />} />
          <Route path='/projects/project/:project_id' element={<Project />}>
            <Route path='pages' element={<Pages />} />
            <Route path='update' element={<EditProject />} />
            <Route path='todos' element={<Todos />} />
            <Route path='todos/create' element={<CreateTodoForm />} />
            <Route path='todos/update/:todo_id' element={<UpdateTodoForm />} />
            <Route path='attachments' element={<Attachments />} />
            <Route path='events' element={<Events />} />
            <Route path='events/create' element={<CreateEventForm />} />
            <Route
              path='events/update/:event_id'
              element={<UpdateEventForm />}
            />
            <Route path='translations' element={<Translations />} />
            <Route path='snippets' element={<Snippets />} />
            <Route path='canvases' element={<Canvases />} />
          </Route>

          <Route path='/projects/' element={<Projects />} />
          <Route path='/projects/create' element={<CreateProject />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}
