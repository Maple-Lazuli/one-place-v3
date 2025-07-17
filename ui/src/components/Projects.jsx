import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/projects/get_all", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setProjects(data.projects);
        } else {
          setError(data.message || "Failed to fetch projects");
        }
      })
      .catch(() => setError("Network error"));
  }, []);

  return (
    <div className="container">
      <Link to="/projects/create">
        <button>Create New Project</button>
      </Link>
      <h2>Projects</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <ul>
        {projects.map((p) => (
          <li key={p.id || p.name}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}