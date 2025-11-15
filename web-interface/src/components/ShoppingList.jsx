import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingListItem } from '../entities/ShoppingListItem'
import './ShoppingList.css'

function ShoppingList({ user }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [newItemName, setNewItemName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)

  useEffect(() => {
    loadItems()
    const unsubscribe = ShoppingListItem.onSnapshot((updatedItems) => {
      setItems(updatedItems.filter(i => !i.is_archived && !i.is_purchased))
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const loadItems = async () => {
    try {
      const allItems = await ShoppingListItem.getAll()
      setItems(allItems.filter(i => !i.is_archived && !i.is_purchased))
      setLoading(false)
    } catch (error) {
      console.error('Error loading items:', error)
      setLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!newItemName.trim()) return
    try {
      await ShoppingListItem.create({
        name: newItemName.trim(),
        quantity: newItemQuantity,
      })
      setNewItemName('')
      setNewItemQuantity(1)
    } catch (error) {
      alert('Error adding item: ' + error.message)
    }
  }

  const handleTogglePurchased = async (id, currentStatus) => {
    try {
      await ShoppingListItem.update(id, { is_purchased: !currentStatus })
    } catch (error) {
      alert('Error updating item: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this item?')) {
      try {
        await ShoppingListItem.delete(id)
      } catch (error) {
        alert('Error deleting item: ' + error.message)
      }
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading shopping list...</p>
      </div>
    )
  }

  return (
    <div className="shopping-list-page">
      <div className="page-header">
        <h1>Shopping List</h1>
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
          min="1"
          value={newItemQuantity}
          onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
          className="quantity-input"
        />
        <button onClick={handleAddItem} className="btn btn-primary">
          Add Item
        </button>
      </div>

      <div className="shopping-items">
        {items.length === 0 ? (
          <div className="empty-state">
            <p>Your shopping list is empty.</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className={`shopping-item ${item.is_purchased ? 'purchased' : ''}`}>
              <input
                type="checkbox"
                checked={item.is_purchased}
                onChange={() => handleTogglePurchased(item.id, item.is_purchased)}
                className="item-checkbox"
              />
              <div className="item-info">
                <span className="item-name">{item.name}</span>
                {item.quantity > 1 && (
                  <span className="item-quantity">x{item.quantity}</span>
                )}
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="btn-icon btn-delete"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ShoppingList

