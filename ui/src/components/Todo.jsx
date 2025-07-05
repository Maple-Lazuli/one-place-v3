import { useState, useEffect } from "react";

export default function Todo() {
  const [items, setItems] = useState([]);
  const [task, setTask] = useState("");

  const fetchTodos = async () => {
    const res = await fetch("http://localhost:3001/demo/todos");
    const data = await res.json();
    setItems(data);
  };

  const addTodo = async () => {
    const res = await fetch("http://localhost:3001/demo/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task }),
    });
    if (res.ok) {
      setTask("");
      fetchTodos();
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>To-Do List</h2>
      <input value={task} onChange={(e) => setTask(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      <ul>
        {items.map((t) => (
          <li key={t.id}>{t.task}</li>
        ))}
      </ul>
    </div>
  );
}
