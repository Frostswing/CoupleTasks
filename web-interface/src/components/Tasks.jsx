import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Task } from '../entities/Task'
import { TASK_CATEGORIES, PRIORITIES } from '../constants/taskCategories'
import './Tasks.css'

function Tasks({ user }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, completed, overdue
  const [categoryFilter, setCategoryFilter] = useState('all')

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

  const handleComplete = async (taskId) => {
    try {
      await Task.update(taskId, { status: 'completed' })
    } catch (error) {
      alert('Error completing task: ' + error.message)
    }
  }

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await Task.delete(taskId)
      } catch (error) {
        alert('Error deleting task: ' + error.message)
      }
    }
  }

  const getFilteredTasks = () => {
    let filtered = tasks

    if (filter === 'pending') {
      filtered = filtered.filter(t => t.status === 'pending' || t.status === 'in_progress')
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.status === 'completed')
    } else if (filter === 'overdue') {
      const now = new Date()
      filtered = filtered.filter(t => {
        if (!t.due_date) return false
        const dueDate = new Date(t.due_date)
        return dueDate < now && t.status !== 'completed'
      })
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter)
    }

    return filtered
  }

  const getCategoryLabel = (category) => {
    return TASK_CATEGORIES.find(c => c.value === category)?.label || category
  }

  const getPriorityLabel = (priority) => {
    return PRIORITIES.find(p => p.value === priority)?.label || priority
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading tasks...</p>
      </div>
    )
  }

  const filteredTasks = getFilteredTasks()

  return (
    <div className="tasks-page">
      <div className="page-header">
        <h1>Tasks</h1>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Category:</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All</option>
            {TASK_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="tasks-list">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks found.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className={`task-card ${task.status}`}>
              <div className="task-header">
                <h3>{task.title}</h3>
                <div className="task-badges">
                  <span className={`badge category-${task.category}`}>
                    {getCategoryLabel(task.category)}
                  </span>
                  <span className={`badge priority-${task.priority}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                  <span className={`badge status-${task.status}`}>
                    {task.status}
                  </span>
                </div>
              </div>
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}
              <div className="task-details">
                {task.due_date && (
                  <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                )}
                {task.assigned_to && (
                  <span>Assigned: {task.assigned_to}</span>
                )}
                {task.estimated_duration && (
                  <span>Duration: {task.estimated_duration}</span>
                )}
              </div>
              <div className="task-actions">
                {task.status !== 'completed' && (
                  <button
                    onClick={() => handleComplete(task.id)}
                    className="btn btn-success"
                  >
                    Complete
                  </button>
                )}
                <button
                  onClick={() => handleDelete(task.id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Tasks

