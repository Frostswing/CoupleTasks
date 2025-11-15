import { ref, get, push, set, update, remove, onValue } from 'firebase/database'
import { database } from '../firebase/config'
import { getDataSource } from '../utils/getDataSource'
import { auth } from '../firebase/config'

export class TaskTemplate {
  constructor(data) {
    this.id = data.id || null
    this.template_name = data.template_name || ''
    this.description = data.description || ''
    this.category = data.category || 'household'
    this.subcategory = data.subcategory || ''
    this.frequency_type = data.frequency_type || 'weekly'
    this.frequency_interval = data.frequency_interval || 1
    this.frequency_custom = data.frequency_custom || null
    this.selected_days = data.selected_days || null
    this.assigned_to = data.assigned_to || ''
    this.estimated_duration = data.estimated_duration || null
    this.priority = data.priority || 'medium'
    this.auto_generate = data.auto_generate || false
    this.generation_offset = data.generation_offset || 0
    this.notification_offset_hours = data.notification_offset_hours || 6
    this.is_active = data.is_active !== undefined ? data.is_active : true
    this.room_location = data.room_location || null
    this.created_by = data.created_by || ''
    this.created_date = data.created_date || new Date().toISOString()
    this.updated_date = data.updated_date || new Date().toISOString()
  }

  static async create(templateData) {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('Must be logged in to create templates')
      }

      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) {
        throw new Error(dataSource.error)
      }

      const templatesRef = ref(database, `${dataSource.path}/task_templates`)
      const newTemplateRef = push(templatesRef)

      const templateWithDefaults = {
        ...templateData,
        created_by: user.email,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        is_active: templateData.is_active !== undefined ? templateData.is_active : true,
        auto_generate: templateData.auto_generate || false,
        generation_offset: templateData.generation_offset || 0,
        notification_offset_hours: templateData.notification_offset_hours || 6,
      }

      await set(newTemplateRef, templateWithDefaults)
      return new TaskTemplate({ id: newTemplateRef.key, ...templateWithDefaults })
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  }

  static async getAll() {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('Must be logged in to get templates')
      }

      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) {
        throw new Error(dataSource.error)
      }

      const templatesRef = ref(database, `${dataSource.path}/task_templates`)
      const snapshot = await get(templatesRef)

      if (!snapshot.exists()) {
        return []
      }

      const data = snapshot.val() || {}
      return Object.entries(data).map(([id, templateData]) =>
        new TaskTemplate({ id, ...templateData })
      )
    } catch (error) {
      console.error('Error getting templates:', error)
      throw error
    }
  }

  static async update(id, updates) {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('Must be logged in to update templates')
      }

      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) {
        throw new Error(dataSource.error)
      }

      const templateRef = ref(database, `${dataSource.path}/task_templates/${id}`)
      await update(templateRef, {
        ...updates,
        updated_date: new Date().toISOString(),
      })

      return true
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  }

  static async delete(id) {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('Must be logged in to delete templates')
      }

      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) {
        throw new Error(dataSource.error)
      }

      const templateRef = ref(database, `${dataSource.path}/task_templates/${id}`)
      await remove(templateRef)
      return true
    } catch (error) {
      console.error('Error deleting template:', error)
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

        const templatesRef = ref(database, `${dataSource.path}/task_templates`)

        const unsubscribeFunc = onValue(
          templatesRef,
          (snapshot) => {
            if (isCancelled) {
              unsubscribeFunc()
              return
            }

            const data = snapshot.val() || {}
            let templates = Object.entries(data).map(([id, templateData]) =>
              new TaskTemplate({ id, ...templateData })
            )

            // Apply filters
            Object.entries(filters).forEach(([key, value]) => {
              if (value && typeof value === 'object' && value['$ne']) {
                templates = templates.filter(template => template[key] !== value['$ne'])
              } else if (value !== undefined && value !== null && value !== '') {
                templates = templates.filter(template => template[key] === value)
              }
            })

            callback(templates)
          },
          (error) => {
            if (!isCancelled) {
              console.error('Error in template listener:', error)
              callback([])
            }
          }
        )

        unsubscribe = unsubscribeFunc
      }).catch((error) => {
        if (!isCancelled) {
          console.error('Error setting up template listener:', error)
          callback([])
        }
      })

      return () => {
        isCancelled = true
        unsubscribe()
      }
    } catch (error) {
      console.error('Error setting up template listener:', error)
      return () => {}
    }
  }
}

