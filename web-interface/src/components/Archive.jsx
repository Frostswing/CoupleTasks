import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Task } from '../entities/Task'
import { ShoppingListItem } from '../entities/ShoppingListItem'
import './Archive.css'

function Archive({ user }) {
  const [tasks, setTasks] = useState([])
  const [shoppingItems, setShoppingItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')

  useEffect(() => {
    loadArchive()
  }, [])

  const loadArchive = async () => {
    try {
      const allTasks = await Task.filter({ is_archived: true })
      const allItems = await ShoppingListItem.getAll()
      setTasks(allTasks)
      setShoppingItems(allItems.filter(i => i.is_archived || i.is_purchased))
      setLoading(false)
    } catch (error) {
      console.error('Error loading archive:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading archive...</p>
      </div>
    )
  }

  return (
    <div className="archive-page">
      <div className="page-header">
        <h1>Archive</h1>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="archive-tabs">
        <button
          className={activeTab === 'tasks' ? 'active' : ''}
          onClick={() => setActiveTab('tasks')}
        >
          Completed Tasks ({tasks.length})
        </button>
        <button
          className={activeTab === 'shopping' ? 'active' : ''}
          onClick={() => setActiveTab('shopping')}
        >
          Purchased Items ({shoppingItems.length})
        </button>
      </div>

      {activeTab === 'tasks' ? (
        <div className="archive-content">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <p>No completed tasks in archive.</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="archive-item">
                <h3>{task.title}</h3>
                <p className="archive-meta">
                  Completed: {task.completion_date ? new Date(task.completion_date).toLocaleDateString() : 'N/A'}
                  {task.completed_by && ` by ${task.completed_by}`}
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="archive-content">
          {shoppingItems.length === 0 ? (
            <div className="empty-state">
              <p>No purchased items in archive.</p>
            </div>
          ) : (
            shoppingItems.map(item => (
              <div key={item.id} className="archive-item">
                <h3>{item.name}</h3>
                <p className="archive-meta">
                  Quantity: {item.quantity} {item.unit}
                  {item.created_date && ` • Added: ${new Date(item.created_date).toLocaleDateString()}`}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Archive

