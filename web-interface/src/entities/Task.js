import { ref, get, push, set, update, remove, onValue } from 'firebase/database'
import { database } from '../firebase/config'
import { getDataSource } from '../utils/getDataSource'
import { auth } from '../firebase/config'

export class Task {
  constructor(data) {
    this.id = data.id || null
    this.title = data.title || ''
    this.description = data.description || ''
    this.category = data.category || 'household'
    this.status = data.status || 'pending'
    this.priority = data.priority || 'medium'
    this.assigned_to = data.assigned_to || ''
    this.due_date = data.due_date || null
    this.due_time = data.due_time || null
    this.recurrence_rule = data.recurrence_rule || 'none'
    this.subtasks = data.subtasks || []
    this.is_archived = data.is_archived || false
    this.archived_date = data.archived_date || null
    this.completion_date = data.completion_date || null
    this.created_by = data.created_by || ''
    this.created_date = data.created_date || new Date().toISOString()
    this.updated_date = data.updated_date || new Date().toISOString()
    this.template_id = data.template_id || null
    this.auto_generated = data.auto_generated || false
    this.scheduled_date = data.scheduled_date || null
    this.estimated_duration = data.estimated_duration || null
    this.actual_duration = data.actual_duration || null
    this.room_location = data.room_location || null
    this.defer_count = data.defer_count || 0
    this.defer_until = data.defer_until || null
    this.completed_by = data.completed_by || null
    this.notification_offset_hours = data.notification_offset_hours || 6
    this.selected_days = data.selected_days || null // Array of day numbers (0-6, 0=Sunday)
    this.postponed_from_date = data.postponed_from_date || null // Original due date before postponing (for biweekly tasks)
    this.postponed_date = data.postponed_date || null // Date when task was postponed
  }

  static async create(taskData) {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('Must be logged in to create tasks')
      }

      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) {
        throw new Error(dataSource.error)
      }

      const tasksRef = ref(database, `${dataSource.path}/tasks`)
      const newTaskRef = push(tasksRef)

      const taskWithDefaults = {
        ...taskData,
        created_by: user.email,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        category: taskData.category || 'household',
        recurrence_rule: taskData.recurrence_rule || 'none',
        subtasks: taskData.subtasks || [],
        is_archived: false
      }

      await set(newTaskRef, taskWithDefaults)
      return new Task({ id: newTaskRef.key, ...taskWithDefaults })
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  static async getAll() {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('Must be logged in to get tasks')
      }

      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) {
        throw new Error(dataSource.error)
      }

      const tasksRef = ref(database, `${dataSource.path}/tasks`)
      const snapshot = await get(tasksRef)

      if (!snapshot.exists()) {
        return []
      }

      const data = snapshot.val() || {}
      return Object.entries(data).map(([id, taskData]) =>
        new Task({ id, ...taskData })
      )
    } catch (error) {
      console.error('Error getting tasks:', error)
      throw error
    }
  }

  static async filter(filters = {}) {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('Must be logged in to filter tasks')
      }

      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) {
        throw new Error(dataSource.error)
      }

      const tasksRef = ref(database, `${dataSource.path}/tasks`)
      const snapshot = await get(tasksRef)

      if (!snapshot.exists()) {
        return []
      }

      const data = snapshot.val() || {}
      let tasks = Object.entries(data).map(([id, taskData]) =>
        new Task({ id, ...taskData })
      )

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'object' && value['$ne']) {
          tasks = tasks.filter(task => task[key] !== value['$ne'])
        } else if (value !== undefined && value !== null && value !== '') {
          tasks = tasks.filter(task => task[key] === value)
        }
      })

      return tasks
    } catch (error) {
      console.error('Error filtering tasks:', error)
      throw error
    }
  }

  static async update(id, updates) {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('Must be logged in to update tasks')
      }

      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) {
        throw new Error(dataSource.error)
      }

      const finalUpdates = { ...updates }
      if (updates.status === 'completed') {
        finalUpdates.is_archived = true
        finalUpdates.archived_date = new Date().toISOString()
        finalUpdates.completion_date = new Date().toISOString()
        if (!finalUpdates.completed_by) {
          finalUpdates.completed_by = user.email
        }
      }

      const taskRef = ref(database, `${dataSource.path}/tasks/${id}`)
      await update(taskRef, {
        ...finalUpdates,
        updated_date: new Date().toISOString(),
      })

      return true
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  static async delete(id) {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('Must be logged in to delete tasks')
      }

      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) {
        throw new Error(dataSource.error)
      }

      const taskRef = ref(database, `${dataSource.path}/tasks/${id}`)
      await remove(taskRef)
      return true
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  static onSnapshot(callback, filters = {}) {
    try {
      const user = auth.currentUser
      if (!user) {
        callback([])
        return () => {}
      }

      let unsubscribe = () => {}
      let isCancelled = false

      getDataSource(user.uid).then((dataSource) => {
        if (isCancelled) {
          return
        }

        if (!dataSource.success) {
          console.error('Error getting data source:', dataSource.error)
          callback([])
          return
        }

        const tasksRef = ref(database, `${dataSource.path}/tasks`)

        const unsubscribeFunc = onValue(
          tasksRef,
          (snapshot) => {
            if (isCancelled) {
              unsubscribeFunc()
              return
            }

            const data = snapshot.val() || {}
            let tasks = Object.entries(data).map(([id, taskData]) =>
              new Task({ id, ...taskData })
            )

            // Apply filters
            Object.entries(filters).forEach(([key, value]) => {
              if (value && typeof value === 'object' && value['$ne']) {
                tasks = tasks.filter(task => task[key] !== value['$ne'])
              } else if (value !== undefined && value !== null && value !== '') {
                tasks = tasks.filter(task => task[key] === value)
              }
            })

            callback(tasks)
          },
          (error) => {
            if (!isCancelled) {
              console.error('Error in task listener:', error)
              callback([])
            }
          }
        )

        unsubscribe = unsubscribeFunc
      }).catch((error) => {
        if (!isCancelled) {
          console.error('Error setting up task listener:', error)
          callback([])
        }
      })

      return () => {
        isCancelled = true
        unsubscribe()
      }
    } catch (error) {
      console.error('Error setting up task listener:', error)
      return () => {}
    }
  }
}

