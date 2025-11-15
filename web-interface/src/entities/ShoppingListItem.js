import { ref, get, push, set, update, remove, onValue } from 'firebase/database'
import { database } from '../firebase/config'
import { getDataSource } from '../utils/getDataSource'
import { auth } from '../firebase/config'

export class ShoppingListItem {
  constructor(data) {
    this.id = data.id || null
    this.name = data.name || ''
    this.category = data.category || 'other'
    this.quantity = data.quantity || 1
    this.unit = data.unit || 'pieces'
    this.is_purchased = data.is_purchased || false
    this.image_url = data.image_url || ''
    this.link = data.link || ''
    this.is_archived = data.is_archived || false
    this.added_by = data.added_by || ''
    this.created_date = data.created_date || new Date().toISOString()
    this.updated_date = data.updated_date || new Date().toISOString()
  }

  static async getAll() {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Must be logged in')
      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) throw new Error(dataSource.error)
      const itemsRef = ref(database, `${dataSource.path}/shopping_list_items`)
      const snapshot = await get(itemsRef)
      if (!snapshot.exists()) return []
      const data = snapshot.val() || {}
      return Object.entries(data).map(([id, itemData]) =>
        new ShoppingListItem({ id, ...itemData })
      )
    } catch (error) {
      console.error('Error getting shopping items:', error)
      throw error
    }
  }

  static async create(itemData) {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Must be logged in')
      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) throw new Error(dataSource.error)
      const itemsRef = ref(database, `${dataSource.path}/shopping_list_items`)
      const newItemRef = push(itemsRef)
      const itemWithDefaults = {
        ...itemData,
        added_by: user.email,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        is_purchased: false,
        is_archived: false,
      }
      await set(newItemRef, itemWithDefaults)
      return new ShoppingListItem({ id: newItemRef.key, ...itemWithDefaults })
    } catch (error) {
      console.error('Error creating shopping item:', error)
      throw error
    }
  }

  static async update(id, updates) {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Must be logged in')
      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) throw new Error(dataSource.error)
      const itemRef = ref(database, `${dataSource.path}/shopping_list_items/${id}`)
      await update(itemRef, { ...updates, updated_date: new Date().toISOString() })
      return true
    } catch (error) {
      console.error('Error updating shopping item:', error)
      throw error
    }
  }

  static async delete(id) {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Must be logged in')
      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) throw new Error(dataSource.error)
      const itemRef = ref(database, `${dataSource.path}/shopping_list_items/${id}`)
      await remove(itemRef)
      return true
    } catch (error) {
      console.error('Error deleting shopping item:', error)
      throw error
    }
  }

  static onSnapshot(callback) {
    try {
      const user = auth.currentUser
      if (!user) {
        callback([])
        return () => {}
      }
      let unsubscribe = () => {}
      let isCancelled = false
      getDataSource(user.uid).then((dataSource) => {
        if (isCancelled || !dataSource.success) {
          callback([])
          return
        }
        const itemsRef = ref(database, `${dataSource.path}/shopping_list_items`)
        const unsubscribeFunc = onValue(itemsRef, (snapshot) => {
          if (isCancelled) {
            unsubscribeFunc()
            return
          }
          const data = snapshot.val() || {}
          const items = Object.entries(data).map(([id, itemData]) =>
            new ShoppingListItem({ id, ...itemData })
          )
          callback(items)
        })
        unsubscribe = unsubscribeFunc
      })
      return () => {
        isCancelled = true
        unsubscribe()
      }
    } catch (error) {
      console.error('Error setting up shopping item listener:', error)
      return () => {}
    }
  }
}

