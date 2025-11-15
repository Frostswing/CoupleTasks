import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { ref, get, update, onValue } from 'firebase/database'
import { auth, database } from '../firebase/config'
import './Dashboard.css'

function Dashboard({ user }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    language_preference: 'en',
    partner_email: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileRef = ref(database, `users/${user.uid}/profile`)
        
        // Set up real-time listener
        const unsubscribe = onValue(profileRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            setProfile(data)
            setFormData({
              full_name: data.full_name || '',
              language_preference: data.language_preference || 'en',
              partner_email: data.partner_email || ''
            })
          } else {
            // Create profile if it doesn't exist
            const newProfile = {
              email: user.email,
              full_name: user.displayName || 'User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              language_preference: 'en'
            }
            set(ref(database, `users/${user.uid}/profile`), newProfile)
            setProfile(newProfile)
            setFormData({
              full_name: newProfile.full_name,
              language_preference: newProfile.language_preference,
              partner_email: ''
            })
          }
          setLoading(false)
        })

        return () => unsubscribe()
      } catch (err) {
        console.error('Error loading profile:', err)
        setError('Failed to load profile')
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (err) {
      setError('Failed to sign out')
    }
  }

  const handleEdit = () => {
    setEditing(true)
    setError('')
    setSuccess('')
  }

  const handleCancel = () => {
    setEditing(false)
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        language_preference: profile.language_preference || 'en',
        partner_email: profile.partner_email || ''
      })
    }
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    try {
      const profileRef = ref(database, `users/${user.uid}/profile`)
      await update(profileRef, {
        ...formData,
        updated_at: new Date().toISOString()
      })
      setEditing(false)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to update profile')
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>💜 CoupleTasks</h1>
        <button onClick={handleLogout} className="logout-button">
          Sign Out
        </button>
      </div>

      <div className="dashboard-content">
        <div className="profile-card">
          <div className="profile-header">
            <h2>User Profile</h2>
            {!editing && (
              <button onClick={handleEdit} className="edit-button">
                Edit
              </button>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="profile-info">
            <div className="info-item">
              <label>Email:</label>
              <span>{user.email}</span>
            </div>

            {editing ? (
              <>
                <div className="info-item">
                  <label htmlFor="full_name">Full Name:</label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="profile-input"
                  />
                </div>

                <div className="info-item">
                  <label htmlFor="language_preference">Language:</label>
                  <select
                    id="language_preference"
                    name="language_preference"
                    value={formData.language_preference}
                    onChange={handleChange}
                    className="profile-input"
                  >
                    <option value="en">English</option>
                    <option value="he">Hebrew</option>
                  </select>
                </div>

                <div className="info-item">
                  <label htmlFor="partner_email">Partner Email:</label>
                  <input
                    id="partner_email"
                    name="partner_email"
                    type="email"
                    value={formData.partner_email}
                    onChange={handleChange}
                    className="profile-input"
                    placeholder="Enter partner's email"
                  />
                </div>

                <div className="profile-actions">
                  <button onClick={handleSave} className="save-button">
                    Save
                  </button>
                  <button onClick={handleCancel} className="cancel-button">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="info-item">
                  <label>Full Name:</label>
                  <span>{profile?.full_name || 'Not set'}</span>
                </div>

                <div className="info-item">
                  <label>Language:</label>
                  <span>{profile?.language_preference === 'he' ? 'Hebrew' : 'English'}</span>
                </div>

                <div className="info-item">
                  <label>Partner Email:</label>
                  <span>{profile?.partner_email || 'Not set'}</span>
                </div>

                {profile?.created_at && (
                  <div className="info-item">
                    <label>Member Since:</label>
                    <span>{new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="info-card">
          <h3>About CoupleTasks</h3>
          <p>
            CoupleTasks is a mobile app designed to help couples manage household tasks, 
            shopping lists, and inventory together in real-time.
          </p>
          <p>
            This web interface allows you to manage your user profile and account settings.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

