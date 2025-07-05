import { useState } from "react";

export default function Todo() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");

  const addItem = () => {
    if (text.trim()) {
      setItems([...items, text]);
      setText("");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-2">📝 To-Do List</h2>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="border p-1 mr-2"
      />
      <button onClick={addItem} className="bg-blue-600 text-white px-2 py-1 rounded">
        Add
      </button>
      <ul className="mt-4 list-disc list-inside">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
