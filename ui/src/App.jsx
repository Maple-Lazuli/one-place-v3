import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Todo from "./components/Todo";
import MarkdownEditor from "./components/MarkdownEditor";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Create a theme or customize here:
const theme = createTheme({
  palette: {
    mode: "light", // or "dark"
    primary: {
      main: "#1976d2", // example blue
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
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/todo" element={<Todo />} />
          <Route path="/notes" element={<MarkdownEditor />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
