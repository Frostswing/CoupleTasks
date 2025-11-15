import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Management from './components/Management'
import TaskTemplates from './components/TaskTemplates'
import Tasks from './components/Tasks'
import TaskPlanning from './components/TaskPlanning'
import ShoppingList from './components/ShoppingList'
import Inventory from './components/Inventory'
import Archive from './components/Archive'
import Events from './components/Events'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" /> : <Register />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/management" 
          element={user ? <Management user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/task-templates" 
          element={user ? <TaskTemplates user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/tasks" 
          element={user ? <Tasks user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/task-planning" 
          element={user ? <TaskPlanning user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/shopping-list" 
          element={user ? <ShoppingList user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/inventory" 
          element={user ? <Inventory user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/archive" 
          element={user ? <Archive user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/events" 
          element={user ? <Events user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </Router>
  )
}

export default App

