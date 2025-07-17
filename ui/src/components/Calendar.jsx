import React from "react";

// Helper to get days in month
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function Calendar({
  year,
  month,
  events = [],
  todos = [],
  renderDayContent, // function(day) => JSX
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

  // Build calendar grid
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(
      <div key={day} className="calendar-cell">
        <div className="calendar-date">{day}</div>
        {renderDayContent && renderDayContent(day)}
      </div>
    );
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="calendar-cell header">{d}</div>
        ))}
      </div>
      <div className="calendar-grid">{cells}</div>
    </div>
  );
}