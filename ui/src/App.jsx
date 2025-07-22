import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'

import Dashboard from './components/Dashboard'
import Todo from './components/Todo'
import MarkdownEditor from './components/MarkdownEditor'
import Login from './components/Login'
import CreateAccount from './components/CreateAccount'
import Home from './components/Home'
import Projects from './components/Projects'
import CreateProject from './components/CreateProject'
import Project from './components/Project'
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
import UpdatePageForm from './components/projects/project/UpdatePageForm'
import CreatePageForm from './components/projects/project/CreatePageForm'
import Page from './components/projects/project/pages/Page'
import PageEditor from './components/projects/project/pages/PageEditor'
import PageContent from './components/projects/project/pages/PageContent'
import EditProject from './components/UpdateProject'
import CreateSnippet from './components/projects/project/pages/CreateSnippet'
import PageSnippets from './components/projects/project/pages/Snippets'
import UpdateSnippetForm from './components/projects/project/pages/UpdateSnippet'
import ViewSnippet from './components/projects/project/pages/ViewSnippet'
import ViewEquation from './components/projects/project/pages/ViewEquation'
import CreateEquationForm from './components/projects/project/pages/CreateEquation'
import UpdateEquationForm from './components/projects/project/pages/UpdateEquation'
import PageEquations from './components/projects/project/pages/Equations'
import PageFiles from './components/projects/project/pages/Files'
import UploadFileForm from './components/projects/project/pages/UploadFile'
import PageTranslations from './components/projects/project/pages/Translations'
import StartTranslationForm from './components/projects/project/pages/StartTranslation'
import UpdateTranslation from './components/projects/project/pages/UpdateTranslation'
import PageCanvases from './components/projects/project/pages/Canvases'
import StartCanvas from './components/projects/project/pages/StartCanvas'
import UpdateCanvasForm from './components/projects/project/pages/UpdateCanvasFields'
import CanvasEditor from './components/projects/project/pages/CanvasEditor'
import UpdateUserAccount from './components/UpdateAccount' // your update account component
import AppLayout from './AppLayout'  // your layout with NavigationBar
import DeleteTags from './components/DeleteTags'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import Equations from './components/projects/project/Equations'

// // PublicLayout for routes without navbar
function PublicLayout() {
  return <Outlet />  // just render the child routes
}

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

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalize and reset styles */}
      <Router>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: '100vh' // full viewport height
          }}
        >
          <Routes>
            {/* Public routes - no navbar */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<CreateAccount />} />
            </Route>

            {/* Authenticated app routes with navbar */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/todo" element={<Todo />} />
              <Route path="/notes" element={<MarkdownEditor />} />
              <Route path="/home" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/create" element={<CreateProject />} />
              <Route path="/update_account" element={<UpdateUserAccount />} />
              <Route path="/delete_tags" element={<DeleteTags />} />

              {/* Nested project routes */}
              <Route path="/projects/project/:project_id" element={<Project />}>
                <Route path="pages" element={<Pages />} />
                <Route path="pages/create" element={<CreatePageForm />} />
                <Route path="pages/update/:page_id" element={<UpdatePageForm />} />

                <Route path="pages/page/:page_id" element={<Page />}>
                  <Route index element={<PageContent />} />
                  <Route path="editor" element={<PageEditor />} />
                  <Route path="snippets" element={<PageSnippets />} />
                  <Route path="snippets/create" element={<CreateSnippet />} />
                  <Route path="snippets/update/:snippet_id" element={<UpdateSnippetForm />} />
                  <Route path="snippets/view/:snippet_id" element={<ViewSnippet />} />
                  <Route path="equations" element={<PageEquations />} />
                  <Route path="equations/create" element={<CreateEquationForm />} />
                  <Route path="equations/update/:equation_id" element={<UpdateEquationForm />} />
                  <Route path="equations/view/:equation_id" element={<ViewEquation />} />
                  <Route path="files" element={<PageFiles />} />
                  <Route path="files/upload" element={<UploadFileForm />} />
                  <Route path="translations" element={<PageTranslations />} />
                  <Route path="translations/start" element={<StartTranslationForm />} />
                  <Route path="translations/update/:translation_id" element={<UpdateTranslation />} />
                  <Route path="canvases" element={<PageCanvases />} />
                  <Route path="canvases/start" element={<StartCanvas />} />
                  <Route path="canvases/update_fields/:canvas_id" element={<UpdateCanvasForm />} />
                  <Route path="canvases/update/:canvas_id" element={<CanvasEditor />} />
                </Route>

                <Route path="update" element={<EditProject />} />
                <Route path="todos" element={<Todos />} />
                <Route path="todos/create" element={<CreateTodoForm />} />
                <Route path="todos/update/:todo_id" element={<UpdateTodoForm />} />
                <Route path="attachments" element={<Attachments />} />
                <Route path="equations" element={<Equations />} />
                <Route path="events" element={<Events />} />
                <Route path="events/create" element={<CreateEventForm />} />
                <Route path="events/update/:event_id" element={<UpdateEventForm />} />
                <Route path="translations" element={<Translations />} />
                <Route path="snippets" element={<Snippets />} />
                <Route path="canvases" element={<Canvases />} />
              </Route>
            </Route>
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  )
}
