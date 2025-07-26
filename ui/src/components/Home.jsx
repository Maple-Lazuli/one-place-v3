import { React, useState } from 'react'
import CalendarView from './Calendar'

export default function Home () {
  const [currentDate, setCurrentDate] = useState(new Date())
  return (
    <div style={{ height: '100%', width: '100vw', margin: 0, padding: 0 }}>
      <CalendarView
        logs_route={`/api/logging/get_user_history?`}
        userEvents_route={`/api/events/get_user_events?`}
        todo_route={`/api/todo/get_user_todo?`}
        currentDate={currentDate} 
        setCurrentDate={setCurrentDate} 
      />
    </div>
  )
}
