import { useState, useEffect } from 'react'
import { TaskTemplate } from '../entities/TaskTemplate'
import { TASK_CATEGORIES, PRIORITIES, FREQUENCY_TYPES } from '../constants/taskCategories'
import { auth } from '../firebase/config'
import './TemplateTableEditor.css'

function TemplateTableEditor({ templates, onSave, onDelete }) {
  const [rows, setRows] = useState([])
  const [editingRow, setEditingRow] = useState(null)
  const [users, setUsers] = useState([])

  useEffect(() => {
    // Initialize rows from templates
    if (templates && templates.length > 0) {
      setRows(templates.map(t => {
        // Convert weekly with interval 2 to biweekly for display
        let frequencyType = t.frequency_type || 'weekly'
        let frequencyInterval = t.frequency_interval || 1
        if (frequencyType === 'weekly' && frequencyInterval === 2) {
          frequencyType = 'biweekly'
          frequencyInterval = 1 // Reset interval for biweekly display
        }
        return {
          id: t.id,
          template_name: t.template_name || '',
          description: t.description || '',
          category: t.category || 'household',
          subcategory: t.subcategory || '',
          frequency_type: frequencyType,
          frequency_interval: frequencyInterval,
          frequency_custom: t.frequency_custom || '',
          selected_days: t.selected_days || null,
          assigned_to: t.assigned_to || '',
          estimated_duration: t.estimated_duration || '',
          priority: t.priority || 'medium',
          auto_generate: t.auto_generate || false,
          room_location: t.room_location || '',
          is_active: t.is_active !== undefined ? t.is_active : true,
        }
      }))
    } else {
      // Start with one empty row
      setRows([createEmptyRow()])
    }
  }, [templates])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      const userList = [{ email: user.email, name: user.displayName || 'Me' }]
      
      // Try to get partner from profile
      const { ref, get } = await import('firebase/database')
      const { database } = await import('../firebase/config')
      const profileRef = ref(database, `users/${user.uid}/profile`)
      const snapshot = await get(profileRef)
      
      if (snapshot.exists()) {
        const profile = snapshot.val()
        if (profile.partner_email) {
          userList.push({ email: profile.partner_email, name: 'Partner' })
        }
      }
      
      userList.push({ email: 'together', name: 'Together' })
      userList.push({ email: 'separately', name: 'Separately' })
      
      setUsers(userList)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const createEmptyRow = () => ({
    id: null,
    template_name: '',
    description: '',
    category: 'household',
    subcategory: '',
    frequency_type: 'weekly',
    frequency_interval: 1,
    frequency_custom: '',
    selected_days: null,
    assigned_to: '',
    estimated_duration: '',
    priority: 'medium',
    auto_generate: false,
    room_location: '',
    is_active: true,
  })

  const handleAddRow = () => {
    setRows([...rows, createEmptyRow()])
  }

  const handleDeleteRow = async (index) => {
    const row = rows[index]
    if (row.id && onDelete) {
      if (window.confirm('Are you sure you want to delete this template?')) {
        try {
          await TaskTemplate.delete(row.id)
          onDelete(row.id)
        } catch (error) {
          alert('Error deleting template: ' + error.message)
        }
      }
    } else {
      const newRows = rows.filter((_, i) => i !== index)
      setRows(newRows.length > 0 ? newRows : [createEmptyRow()])
    }
  }

  const handleCellChange = (index, field, value) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value }
    setRows(newRows)
    setEditingRow(index)
  }

  const handleSaveRow = async (index) => {
    const row = rows[index]
    
    if (!row.template_name.trim()) {
      alert('Template name is required')
      return
    }

    // Convert biweekly to weekly with interval 2 for storage
    let frequencyType = row.frequency_type
    let frequencyInterval = parseInt(row.frequency_interval) || 1
    if (frequencyType === 'biweekly') {
      frequencyType = 'weekly'
      frequencyInterval = 2
    }

    try {
      if (row.id) {
        // Update existing template
        await TaskTemplate.update(row.id, {
          template_name: row.template_name,
          description: row.description,
          category: row.category,
          subcategory: row.subcategory,
          frequency_type: frequencyType,
          frequency_interval: frequencyInterval,
          frequency_custom: row.frequency_custom || null,
          selected_days: row.selected_days || null,
          assigned_to: row.assigned_to,
          estimated_duration: row.estimated_duration || null,
          priority: row.priority,
          auto_generate: row.auto_generate,
          room_location: row.room_location || null,
          is_active: row.is_active,
        })
      } else {
        // Create new template
        const newTemplate = await TaskTemplate.create({
          template_name: row.template_name,
          description: row.description,
          category: row.category,
          subcategory: row.subcategory,
          frequency_type: frequencyType,
          frequency_interval: frequencyInterval,
          frequency_custom: row.frequency_custom || null,
          selected_days: row.selected_days || null,
          assigned_to: row.assigned_to,
          estimated_duration: row.estimated_duration || null,
          priority: row.priority,
          auto_generate: row.auto_generate,
          room_location: row.room_location || null,
          is_active: row.is_active,
        })
        // Update row with new ID
        const newRows = [...rows]
        newRows[index] = { ...newRows[index], id: newTemplate.id }
        setRows(newRows)
      }
      
      setEditingRow(null)
      if (onSave) onSave()
    } catch (error) {
      alert('Error saving template: ' + error.message)
    }
  }

  const handleSaveAll = async () => {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].template_name.trim()) {
        await handleSaveRow(i)
      }
    }
  }

  return (
    <div className="template-table-editor">
      <div className="table-header">
        <h2>Task Templates</h2>
        <div className="table-actions">
          <button onClick={handleAddRow} className="btn btn-primary">
            + Add Row
          </button>
          <button onClick={handleSaveAll} className="btn btn-success">
            Save All
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="template-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Category</th>
              <th>Subcategory</th>
              <th>Frequency Type</th>
              <th>Interval</th>
              <th>Custom Freq.</th>
              <th>Selected Days</th>
              <th>Assigned To</th>
              <th>Duration</th>
              <th>Priority</th>
              <th>Auto Gen.</th>
              <th>Room</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id || index} className={editingRow === index ? 'editing' : ''}>
                <td>
                  <input
                    type="text"
                    value={row.template_name}
                    onChange={(e) => handleCellChange(index, 'template_name', e.target.value)}
                    placeholder="Task name"
                    className="table-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => handleCellChange(index, 'description', e.target.value)}
                    placeholder="Description"
                    className="table-input"
                  />
                </td>
                <td>
                  <select
                    value={row.category}
                    onChange={(e) => handleCellChange(index, 'category', e.target.value)}
                    className="table-select"
                  >
                    {TASK_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={row.subcategory}
                    onChange={(e) => handleCellChange(index, 'subcategory', e.target.value)}
                    placeholder="Subcategory"
                    className="table-input"
                  />
                </td>
                <td>
                  <select
                    value={row.frequency_type}
                    onChange={(e) => handleCellChange(index, 'frequency_type', e.target.value)}
                    className="table-select"
                  >
                    {FREQUENCY_TYPES.map(ft => (
                      <option key={ft.value} value={ft.value}>{ft.label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  {row.frequency_type === 'biweekly' ? (
                    <span className="text-muted">2 weeks</span>
                  ) : (
                    <input
                      type="number"
                      value={row.frequency_interval}
                      onChange={(e) => handleCellChange(index, 'frequency_interval', e.target.value)}
                      min="1"
                      className="table-input number-input"
                    />
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    value={row.frequency_custom}
                    onChange={(e) => handleCellChange(index, 'frequency_custom', e.target.value)}
                    placeholder="Custom frequency"
                    className="table-input"
                    disabled={row.frequency_type !== 'custom'}
                  />
                </td>
                <td>
                  {(row.frequency_type === 'weekly' || row.frequency_type === 'biweekly' || row.frequency_type === 'times_per_week') ? (
                    <div className="days-selector">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayLabel, dayIndex) => {
                        const isSelected = row.selected_days && row.selected_days.includes(dayIndex)
                        return (
                          <label key={dayIndex} className="day-checkbox-label">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentDays = row.selected_days || []
                                let newDays
                                if (e.target.checked) {
                                  newDays = [...currentDays, dayIndex]
                                } else {
                                  newDays = currentDays.filter(d => d !== dayIndex)
                                }
                                handleCellChange(index, 'selected_days', newDays.length > 0 ? newDays : null)
                              }}
                              className="day-checkbox"
                            />
                            <span className={isSelected ? 'day-checked' : ''}>{dayLabel}</span>
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
                <td>
                  <select
                    value={row.assigned_to}
                    onChange={(e) => handleCellChange(index, 'assigned_to', e.target.value)}
                    className="table-select"
                  >
                    <option value="">None</option>
                    {users.map(u => (
                      <option key={u.email} value={u.email}>{u.name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={row.estimated_duration}
                    onChange={(e) => handleCellChange(index, 'estimated_duration', e.target.value)}
                    placeholder="e.g., 30 min"
                    className="table-input"
                  />
                </td>
                <td>
                  <select
                    value={row.priority}
                    onChange={(e) => handleCellChange(index, 'priority', e.target.value)}
                    className="table-select"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={row.auto_generate}
                    onChange={(e) => handleCellChange(index, 'auto_generate', e.target.checked)}
                    className="table-checkbox"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.room_location}
                    onChange={(e) => handleCellChange(index, 'room_location', e.target.value)}
                    placeholder="Room/location"
                    className="table-input"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={row.is_active}
                    onChange={(e) => handleCellChange(index, 'is_active', e.target.checked)}
                    className="table-checkbox"
                  />
                </td>
                <td>
                  <div className="row-actions">
                    {editingRow === index ? (
                      <button
                        onClick={() => handleSaveRow(index)}
                        className="btn-icon btn-save"
                        title="Save"
                      >
                        ✓
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingRow(index)}
                        className="btn-icon btn-edit"
                        title="Edit"
                      >
                        ✎
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteRow(index)}
                      className="btn-icon btn-delete"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TemplateTableEditor

