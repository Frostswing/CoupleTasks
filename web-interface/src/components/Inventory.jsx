import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ref, get, push, set, update, remove, onValue } from 'firebase/database'
import { database } from '../firebase/config'
import { getDataSource } from '../utils/getDataSource'
import { auth } from '../firebase/config'
import './Inventory.css'

function Inventory({ user }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [newItemName, setNewItemName] = useState('')
  const [newItemAmount, setNewItemAmount] = useState(0)

  useEffect(() => {
    loadItems()
    const unsubscribe = setupListener()
    return () => unsubscribe()
  }, [])

  const setupListener = () => {
    let unsubscribe = () => {}
    getDataSource(user.uid).then((dataSource) => {
      if (!dataSource.success) return
      const itemsRef = ref(database, `${dataSource.path}/inventory_items`)
      unsubscribe = onValue(itemsRef, (snapshot) => {
        const data = snapshot.val() || {}
        setItems(Object.entries(data).map(([id, itemData]) => ({ id, ...itemData })))
        setLoading(false)
      })
    })
    return () => unsubscribe()
  }

  const loadItems = async () => {
    try {
      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) throw new Error(dataSource.error)
      const itemsRef = ref(database, `${dataSource.path}/inventory_items`)
      const snapshot = await get(itemsRef)
      if (snapshot.exists()) {
        const data = snapshot.val() || {}
        setItems(Object.entries(data).map(([id, itemData]) => ({ id, ...itemData })))
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading inventory:', error)
      setLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!newItemName.trim()) return
    try {
      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) throw new Error(dataSource.error)
      const itemsRef = ref(database, `${dataSource.path}/inventory_items`)
      const newItemRef = push(itemsRef)
      await set(newItemRef, {
        name: newItemName.trim(),
        current_amount: newItemAmount,
        minimum_amount: 1,
        unit: 'pieces',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      })
      setNewItemName('')
      setNewItemAmount(0)
    } catch (error) {
      alert('Error adding item: ' + error.message)
    }
  }

  const handleUpdateAmount = async (id, newAmount) => {
    try {
      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) throw new Error(dataSource.error)
      const itemRef = ref(database, `${dataSource.path}/inventory_items/${id}`)
      await update(itemRef, {
        current_amount: newAmount,
        updated_date: new Date().toISOString(),
      })
    } catch (error) {
      alert('Error updating item: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this item?')) {
      try {
        const dataSource = await getDataSource(user.uid)
        if (!dataSource.success) throw new Error(dataSource.error)
        const itemRef = ref(database, `${dataSource.path}/inventory_items/${id}`)
        await remove(itemRef)
      } catch (error) {
        alert('Error deleting item: ' + error.message)
      }
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading inventory...</p>
      </div>
    )
  }

  return (
    <div className="inventory-page">
      <div className="page-header">
        <h1>Inventory</h1>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="add-item-form">
        <input
          type="text"
          placeholder="Item name"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
          className="item-input"
        />
        <input
          type="number"
          min="0"
          value={newItemAmount}
          onChange={(e) => setNewItemAmount(parseFloat(e.target.value) || 0)}
          placeholder="Amount"
          className="amount-input"
        />
        <button onClick={handleAddItem} className="btn btn-primary">
          Add Item
        </button>
      </div>

      <div className="inventory-items">
        {items.length === 0 ? (
          <div className="empty-state">
            <p>Your inventory is empty.</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className={`inventory-item ${(item.current_amount || 0) < (item.minimum_amount || 1) ? 'low-stock' : ''}`}>
              <div className="item-info">
                <span className="item-name">{item.name}</span>
                <span className="item-amount">
                  {item.current_amount || 0} {item.unit || 'pieces'}
                </span>
              </div>
              <div className="item-actions">
                <input
                  type="number"
                  min="0"
                  value={item.current_amount || 0}
                  onChange={(e) => handleUpdateAmount(item.id, parseFloat(e.target.value) || 0)}
                  className="amount-input-small"
                />
                <button
                  onClick={() => handleDelete(item.id)}
                  className="btn-icon btn-delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Inventory

