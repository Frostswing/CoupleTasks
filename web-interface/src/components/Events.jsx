import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ref, get, push, set, update, remove, onValue } from 'firebase/database'
import { database } from '../firebase/config'
import { getDataSource } from '../utils/getDataSource'
import { auth } from '../firebase/config'
import './Events.css'

function Events({ user }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventTime, setNewEventTime] = useState('')

  useEffect(() => {
    loadEvents()
    const unsubscribe = setupListener()
    return () => unsubscribe()
  }, [])

  const setupListener = () => {
    let unsubscribe = () => {}
    getDataSource(user.uid).then((dataSource) => {
      if (!dataSource.success) return
      const eventsRef = ref(database, `${dataSource.path}/events`)
      unsubscribe = onValue(eventsRef, (snapshot) => {
        const data = snapshot.val() || {}
        setEvents(Object.entries(data).map(([id, eventData]) => ({ id, ...eventData })).filter(e => !e.is_archived))
        setLoading(false)
      })
    })
    return () => unsubscribe()
  }

  const loadEvents = async () => {
    try {
      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) throw new Error(dataSource.error)
      const eventsRef = ref(database, `${dataSource.path}/events`)
      const snapshot = await get(eventsRef)
      if (snapshot.exists()) {
        const data = snapshot.val() || {}
        setEvents(Object.entries(data).map(([id, eventData]) => ({ id, ...eventData })).filter(e => !e.is_archived))
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading events:', error)
      setLoading(false)
    }
  }

  const handleAddEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate) return
    try {
      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) throw new Error(dataSource.error)
      const eventsRef = ref(database, `${dataSource.path}/events`)
      const newEventRef = push(eventsRef)
      await set(newEventRef, {
        title: newEventTitle.trim(),
        event_date: newEventDate,
        event_time: newEventTime || '',
        event_type: 'informational',
        status: 'pending',
        category: 'social',
        created_by: user.email,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        is_archived: false,
      })
      setNewEventTitle('')
      setNewEventDate('')
      setNewEventTime('')
    } catch (error) {
      alert('Error adding event: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this event?')) {
      try {
        const dataSource = await getDataSource(user.uid)
        if (!dataSource.success) throw new Error(dataSource.error)
        const eventRef = ref(database, `${dataSource.path}/events/${id}`)
        await remove(eventRef)
      } catch (error) {
        alert('Error deleting event: ' + error.message)
      }
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading events...</p>
      </div>
    )
  }

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = a.event_date ? new Date(a.event_date) : new Date(0)
    const dateB = b.event_date ? new Date(b.event_date) : new Date(0)
    return dateA - dateB
  })

  return (
    <div className="events-page">
      <div className="page-header">
        <h1>Events</h1>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="add-event-form">
        <input
          type="text"
          placeholder="Event title"
          value={newEventTitle}
          onChange={(e) => setNewEventTitle(e.target.value)}
          className="event-input"
        />
        <input
          type="date"
          value={newEventDate}
          onChange={(e) => setNewEventDate(e.target.value)}
          className="event-input"
        />
        <input
          type="time"
          value={newEventTime}
          onChange={(e) => setNewEventTime(e.target.value)}
          className="event-input"
        />
        <button onClick={handleAddEvent} className="btn btn-primary">
          Add Event
        </button>
      </div>

      <div className="events-list">
        {sortedEvents.length === 0 ? (
          <div className="empty-state">
            <p>No events scheduled.</p>
          </div>
        ) : (
          sortedEvents.map(event => (
            <div key={event.id} className="event-card">
              <div className="event-header">
                <h3>{event.title}</h3>
                <span className={`badge status-${event.status}`}>
                  {event.status}
                </span>
              </div>
              <div className="event-details">
                {event.event_date && (
                  <span>Date: {new Date(event.event_date).toLocaleDateString()}</span>
                )}
                {event.event_time && (
                  <span>Time: {event.event_time}</span>
                )}
                {event.location && (
                  <span>Location: {event.location}</span>
                )}
              </div>
              {event.description && (
                <p className="event-description">{event.description}</p>
              )}
              <button
                onClick={() => handleDelete(event.id)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Events

