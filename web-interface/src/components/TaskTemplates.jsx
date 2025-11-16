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

  const handleExport = () => {
    try {
      // Prepare templates for export (remove internal IDs and metadata)
      const exportData = templates.map(template => {
        const { id, created_by, created_date, updated_date, ...exportTemplate } = template
        return exportTemplate
      })

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `task-templates-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert(`Exported ${templates.length} template(s) successfully!`)
    } catch (error) {
      console.error('Error exporting templates:', error)
      alert('Error exporting templates: ' + error.message)
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const importedData = JSON.parse(text)

      if (!Array.isArray(importedData)) {
        throw new Error('Invalid file format: Expected an array of templates')
      }

      if (importedData.length === 0) {
        alert('File contains no templates')
        return
      }

      // Validate templates
      const validTemplates = []
      const errors = []

      for (let i = 0; i < importedData.length; i++) {
        const template = importedData[i]
        
        // Basic validation
        if (!template.template_name || typeof template.template_name !== 'string') {
          errors.push(`Template ${i + 1}: Missing or invalid template_name`)
          continue
        }

        // Validate required fields with defaults
        const validTemplate = {
          template_name: template.template_name.trim(),
          description: template.description || '',
          category: template.category || 'household',
          subcategory: template.subcategory || '',
          frequency_type: template.frequency_type || 'weekly',
          frequency_interval: template.frequency_interval || 1,
          frequency_custom: template.frequency_custom || null,
          selected_days: template.selected_days || null,
          assigned_to: template.assigned_to || '',
          estimated_duration: template.estimated_duration || null,
          priority: template.priority || 'medium',
          auto_generate: template.auto_generate || false,
          generation_offset: template.generation_offset || 0,
          notification_offset_hours: template.notification_offset_hours || 6,
          room_location: template.room_location || null,
          is_active: template.is_active !== undefined ? template.is_active : true,
        }

        // Validate frequency_type
        const validFrequencyTypes = ['daily', 'weekly', 'monthly', 'times_per_week', 'custom']
        if (!validFrequencyTypes.includes(validTemplate.frequency_type)) {
          errors.push(`Template "${validTemplate.template_name}": Invalid frequency_type`)
          continue
        }

        // Validate category
        const validCategories = ['household', 'errands', 'planning', 'finance', 'health', 'social', 'personal', 'other']
        if (!validCategories.includes(validTemplate.category)) {
          errors.push(`Template "${validTemplate.template_name}": Invalid category`)
          continue
        }

        // Validate priority
        const validPriorities = ['low', 'medium', 'high']
        if (!validPriorities.includes(validTemplate.priority)) {
          errors.push(`Template "${validTemplate.template_name}": Invalid priority`)
          continue
        }

        validTemplates.push(validTemplate)
      }

      if (errors.length > 0) {
        const errorMsg = `Import completed with ${errors.length} error(s):\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}`
        alert(errorMsg)
      }

      if (validTemplates.length === 0) {
        alert('No valid templates found in file')
        return
      }

      // Confirm import
      const confirmMsg = `Import ${validTemplates.length} template(s)?\n\nThis will create new templates. Existing templates will not be modified.`
      if (!window.confirm(confirmMsg)) {
        return
      }

      // Create templates
      let successCount = 0
      let failCount = 0

      for (const template of validTemplates) {
        try {
          await TaskTemplate.create(template)
          successCount++
        } catch (error) {
          console.error(`Error creating template "${template.template_name}":`, error)
          failCount++
        }
      }

      // Reload templates
      await loadTemplates()

      // Show results
      if (failCount === 0) {
        alert(`Successfully imported ${successCount} template(s)!`)
      } else {
        alert(`Imported ${successCount} template(s), ${failCount} failed.`)
      }
    } catch (error) {
      console.error('Error importing templates:', error)
      if (error instanceof SyntaxError) {
        alert('Error: Invalid JSON file format')
      } else {
        alert('Error importing templates: ' + error.message)
      }
    } finally {
      // Reset file input
      event.target.value = ''
    }
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
          <div className="import-export-actions">
            <button
              onClick={handleExport}
              className="btn btn-secondary"
              disabled={templates.length === 0}
              title="Export templates to JSON file"
            >
              Export Templates
            </button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', marginLeft: '8px' }}>
              Import Templates
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
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
                  <span>Frequency: {
                    template.frequency_type === 'weekly' && template.frequency_interval === 2
                      ? 'Biweekly'
                      : template.frequency_type === 'weekly'
                      ? `Weekly (${template.frequency_interval})`
                      : template.frequency_type === 'times_per_week'
                      ? `${template.frequency_interval} times per week`
                      : `${template.frequency_type} (${template.frequency_interval})`
                  }</span>
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

