import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Task } from '../entities/Task'
import './TaskPlanning.css'

function TaskPlanning({ user }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // 'week' or 'month'

  useEffect(() => {
    loadTasks()
    
    const unsubscribe = Task.onSnapshot((updatedTasks) => {
      setTasks(updatedTasks.filter(t => !t.is_archived))
      setLoading(false)
    }, { is_archived: { '$ne': true } })

    return () => unsubscribe()
  }, [])

  const loadTasks = async () => {
    try {
      const allTasks = await Task.filter({ is_archived: { '$ne': true } })
      setTasks(allTasks)
      setLoading(false)
    } catch (error) {
      console.error('Error loading tasks:', error)
      setLoading(false)
    }
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getTasksForDate = (date) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return tasks.filter(task => {
      if (!task.due_date) return false
      const taskDate = new Date(task.due_date).toISOString().split('T')[0]
      return taskDate === dateStr
    })
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const isToday = (date) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading tasks...</p>
      </div>
    )
  }

  const days = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="task-planning-page">
      <div className="page-header">
        <h1>Task Planning</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
          </div>
          <Link to="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="calendar-controls">
        <button onClick={() => navigateMonth(-1)} className="btn-nav">
          ← Previous
        </button>
        <h2>{monthName}</h2>
        <button onClick={() => navigateMonth(1)} className="btn-nav">
          Next →
        </button>
        <button onClick={() => setCurrentDate(new Date())} className="btn-today">
          Today
        </button>
      </div>

      <div className="calendar-container">
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-day-header">
              {day}
            </div>
          ))}
          
          {days.map((date, index) => {
            const dayTasks = getTasksForDate(date)
            return (
              <div
                key={index}
                className={`calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''}`}
              >
                {date && (
                  <>
                    <div className="day-number">{date.getDate()}</div>
                    <div className="day-tasks">
                      {dayTasks.slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          className={`task-indicator priority-${task.priority}`}
                          title={task.title}
                        >
                          {task.title.substring(0, 20)}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="task-more">+{dayTasks.length - 3} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TaskPlanning

