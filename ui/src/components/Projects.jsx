import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/get_all`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unauthorized or failed request");
        }
        return res.json();
      })
      .then((data) => {
        if (data.status === "success") {
          const projectList = data.message;
          if (!projectList || projectList.length === 0) {
            setError("No projects found.");
            setProjects([]);
            setOpen(true);
          } else {
            setProjects(projectList);
            setError("");
            setOpen(false);
          }
        } else {
          setError(data.message || "Failed to fetch projects");
          setProjects([]);
          setOpen(true);
        }
      })
      .catch((err) => {
        setError(err.message || "Network error");
        setProjects([]);
        setOpen(true);
      });
  }, []);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <div className="container">
      <Link to="/projects/create">
        <button>Create New Project</button>
      </Link>
      <h2>Projects</h2>

      {/* Snackbar for error messages */}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>

      {projects.length === 0 && !open ? (
        <p>No projects available. Create one to get started.</p>
      ) : (
        <ul>
          {projects.map((p) => (
            <li key={p.id || p.name}>{p.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
