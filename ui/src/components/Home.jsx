import React from 'react';
import CalendarView from './Calendar';

export default function Home() {
  return (
    <div style={{ height: '80vh', width: '100vw', margin: 0, padding: 0 }}>
      <CalendarView 
      logs_route={`/api/logging/get_user_history?`}
      userEvents_route={`/api/events/get_user_events?`}
      todo_route={`/api/todo/get_user_todo?`}
      />
    </div>
  );
}
