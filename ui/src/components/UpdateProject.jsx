import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function EditProject() {
  const { project_id } = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const maxChars = 250;

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/get?id=${project_id}`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch project.");
        }

        const data = await res.json();

        if (data.status === "success") {
          setName(data.message.name);
          setDescription(data.message.description || "");
        } else {
          setError(data.message || "Error fetching project");
        }
      } catch (err) {
        setError(err.message || "Network error");
      }
    }

    fetchProject();
  }, [project_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    if (description.length > maxChars) {
      setError(`Description cannot exceed ${maxChars} characters`);
      return;
    }

    try {
      const response = await fetch(`/api/projects/update`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: project_id,
          new_project_name: name,
          new_project_description: description,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        navigate("/projects");
      } else {
        setError(data.message || "Failed to update project");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="container">
      <h2>Edit Project</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="project_name">Project Name: </label>
          <input
            id="project_name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="project_description">Description: </label>
          <textarea
            id="project_description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={maxChars}
            rows={4}
          />
          <p style={{ fontSize: "0.9em", color: description.length > maxChars ? "red" : "gray" }}>
            {description.length}/{maxChars} characters
          </p>
        </div>
        <button type="submit">Update Project</button>
      </form>
    </div>
  );
}
