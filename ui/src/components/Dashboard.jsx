import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to OnePlace</h1>
      <button
        className="m-2 p-2 bg-blue-500 text-white rounded"
        onClick={() => navigate("/todo")}
      >
        ➕ To-Do List
      </button>
      <button
        className="m-2 p-2 bg-green-500 text-white rounded"
        onClick={() => navigate("/notes")}
      >
        📝 Write Thoughts
      </button>
    </div>
  );
}
