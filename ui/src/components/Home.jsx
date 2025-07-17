import { useState } from "react";
import Calendar from "./Calendar";
import "./Calendar.css";

export default function Home() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // Example events/todos
  const events = [
    { day: 5, title: "Meeting" },
    { day: 12, title: "Project Due" },
  ];
  const todos = [
    { day: 5, task: "Buy groceries" },
    { day: 8, task: "Write blog post" },
  ];

  function renderDayContent(day) {
    return (
      <div>
        {events.filter(e => e.day === day).map(e => (
          <div key={e.title} style={{ color: "blue" }}>{e.title}</div>
        ))}
        {todos.filter(t => t.day === day).map(t => (
          <div key={t.task} style={{ color: "green" }}>{t.task}</div>
        ))}
      </div>
    );
  }

  function handlePrevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function handleNextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1>Analytics Dashboard</h1>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
        <button onClick={handlePrevMonth}>&lt; Prev</button>
        <span style={{ margin: "0 1rem" }}>
          {now.toLocaleString("default", { month: "long" , year: "numeric" })}
          {` ${year} - ${month + 1}`}
        </span>
        <button onClick={handleNextMonth}>Next &gt;</button>
      </div>
      <Calendar
        year={year}
        month={month}
        events={events}
        todos={todos}
        renderDayContent={renderDayContent}
      />
    </div>
  );
}