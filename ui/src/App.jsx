import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Todo from "./components/Todo";
import MarkdownEditor from "./components/MarkdownEditor";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/todo" element={<Todo />} />
        <Route path="/notes" element={<MarkdownEditor />} />
      </Routes>
    </Router>
  );
}
