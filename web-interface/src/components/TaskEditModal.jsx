import { useState, useEffect } from 'react'
import { TASK_CATEGORIES, PRIORITIES } from '../constants/taskCategories'
import { Task } from '../entities/Task'
import './TaskEditModal.css'

function TaskEditModal({ task, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'household',
    priority: 'medium',
    due_date: '',
    assigned_to: '',
    estimated_duration: ''
  })

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        category: task.category || 'household',
        priority: task.priority || 'medium',
        due_date: task.due_date || '',
        assigned_to: task.assigned_to || '',
        estimated_duration: task.estimated_duration || ''
      })
    }
  }, [task])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await Task.update(task.id, formData)
      onSave()
      onClose()
    } catch (error) {
      alert('Error updating task: ' + error.message)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Task</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="edit-task-form">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {TASK_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              {PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="due_date">Due Date</label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="assigned_to">Assigned To</label>
            <input
              type="text"
              id="assigned_to"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              placeholder="Email or Name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="estimated_duration">Estimated Duration</label>
            <input
              type="text"
              id="estimated_duration"
              name="estimated_duration"
              value={formData.estimated_duration}
              onChange={handleChange}
              placeholder="e.g. 30 mins"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-save">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskEditModal
