import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TaskTemplate } from '../entities/TaskTemplate'
import TemplateTableEditor from './TemplateTableEditor'
import './TaskTemplates.css'

function TaskTemplates({ user }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('table') // 'table' or 'list'

  useEffect(() => {
    loadTemplates()
    
    // Set up real-time listener
    const unsubscribe = TaskTemplate.onSnapshot((updatedTemplates) => {
      setTemplates(updatedTemplates)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loadTemplates = async () => {
    try {
      const allTemplates = await TaskTemplate.getAll()
      setTemplates(allTemplates)
      setLoading(false)
    } catch (error) {
      console.error('Error loading templates:', error)
      setLoading(false)
    }
  }

  const handleSave = () => {
    loadTemplates()
  }

  const handleDelete = (templateId) => {
    setTemplates(templates.filter(t => t.id !== templateId))
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading templates...</p>
      </div>
    )
  }

  return (
    <div className="task-templates-page">
      <div className="page-header">
        <h1>Task Templates</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
          </div>
          <Link to="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {viewMode === 'table' ? (
        <TemplateTableEditor
          templates={templates}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ) : (
        <div className="templates-list">
          {templates.length === 0 ? (
            <div className="empty-state">
              <p>No templates yet. Use Table View to add templates easily.</p>
            </div>
          ) : (
            templates.map(template => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <h3>{template.template_name}</h3>
                  <span className={`badge ${template.is_active ? 'active' : 'inactive'}`}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="template-description">{template.description}</p>
                <div className="template-details">
                  <span>Category: {template.category}</span>
                  <span>Frequency: {template.frequency_type} ({template.frequency_interval})</span>
                  <span>Priority: {template.priority}</span>
                  {template.auto_generate && <span className="badge-auto">Auto-generate</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default TaskTemplates

