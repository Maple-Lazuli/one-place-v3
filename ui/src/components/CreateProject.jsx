import { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function CreateProject() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const maxChars = 250;

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
      const response = await fetch("/api/projects/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_name: name,
          project_description: description,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        navigate("/projects");
      } else {
        setError(data.message || "Failed to create project");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="container">
      <h2>Create New Project</h2>
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
        <button type="submit">Create Project</button>
      </form>
    </div>
  );
}
