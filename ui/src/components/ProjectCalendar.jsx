import { React, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import CalendarView from './Calendar'

export default function ProjectCalendar () {
  const [currentDate, setCurrentDate] = useState(new Date())

  const { project_id } = useParams()
  return (
    <div style={{ height: '80vh', width: '100vw', margin: 0, padding: 0 }}>
      <CalendarView
        logs_route={`/api/logging/get_project_history?id=${project_id}&`}
        userEvents_route={`/api/events/get_project_events?project_id=${project_id}&`}
        todo_route={`/api/todo/get_project_todo?project_id=${project_id}&`}
        currentDate={currentDate} 
        setCurrentDate={setCurrentDate}
      />
    </div>
  )
}
