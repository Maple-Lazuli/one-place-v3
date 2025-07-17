import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Todo from "./components/Todo";
import MarkdownEditor from "./components/MarkdownEditor";
import Login from "./components/Login";
import CreateAccount from "./components/CreateAccount";
import Home from "./components/Home";
import NavigationBar from "./components/NavigationBar";
import Projects from "./components/Projects";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    mode: "light", 
    primary: {
      main: "#1976d2", 
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalize and reset styles */}
      <Router>
        <NavigationBar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/todo" element={<Todo />} />
          <Route path="/notes" element={<MarkdownEditor />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<CreateAccount />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          {/* Add other routes as needed */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
