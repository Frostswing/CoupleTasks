import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ref, get } from 'firebase/database'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { database, auth } from '../firebase/config'
import './Management.css'

const DATE_RANGES = {
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  LAST_60_DAYS: 'last_60_days',
  CUSTOM: 'custom',
}

const ARCHIVE_DAYS = 60

// Helper functions for date operations
const startOfDay = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const endOfDay = (date) => {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

const startOfWeek = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  return startOfDay(new Date(d.setDate(diff)))
}

const endOfWeek = (date) => {
  const d = startOfWeek(date)
  d.setDate(d.getDate() + 6)
  return endOfDay(d)
}

const startOfMonth = (date) => {
  const d = new Date(date)
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1))
}

const endOfMonth = (date) => {
  const d = new Date(date)
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

const subDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

const differenceInDays = (dateLeft, dateRight) => {
  const diffTime = Math.abs(dateLeft - dateRight)
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

const isWithinInterval = (date, interval) => {
  return date >= interval.start && date <= interval.end
}

const format = (date, formatStr) => {
  const d = new Date(date)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  if (formatStr === 'MMM d, yyyy') {
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  }
  if (formatStr === 'MMM d') {
    return `${months[d.getMonth()]} ${d.getDate()}`
  }
  if (formatStr === 'yyyy-MM-dd') {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return d.toLocaleDateString()
}

const parseISO = (dateString) => {
  return new Date(dateString)
}

function Management({ user }) {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [partner, setPartner] = useState(null)
  const [selectedUser, setSelectedUser] = useState('myself')
  const [dateRange, setDateRange] = useState(DATE_RANGES.LAST_60_DAYS)
  const [customStartDate, setCustomStartDate] = useState(subDays(new Date(), 60))
  const [customEndDate, setCustomEndDate] = useState(new Date())
  const [allTasks, setAllTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stats, setStats] = useState(null)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (err) {
      console.error('Failed to sign out:', err)
    }
  }

  // Get data source path (shared or personal)
  const getDataSource = useCallback(async (userId) => {
    try {
      const profileRef = ref(database, `users/${userId}/profile`)
      const snapshot = await get(profileRef)
      if (snapshot.exists()) {
        const profile = snapshot.val()
        if (profile.shared_space_id) {
          return { success: true, path: `shared/${profile.shared_space_id}` }
        }
      }
      return { success: true, path: `users/${userId}` }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  // Load user and partner data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profileRef = ref(database, `users/${user.uid}/profile`)
        const snapshot = await get(profileRef)
        if (snapshot.exists()) {
          const profileData = snapshot.val()
          setCurrentUser({ ...profileData, uid: user.uid, email: user.email })

          // Load partner if exists
          if (profileData.partner_email) {
            try {
              const usersRef = ref(database, 'users')
              const usersSnapshot = await get(usersRef)
              if (usersSnapshot.exists()) {
                const users = usersSnapshot.val()
                for (const [uid, userData] of Object.entries(users)) {
                  if (userData.profile && userData.profile.email === profileData.partner_email) {
                    setPartner({ ...userData.profile, uid })
                    break
                  }
                }
              }
            } catch (error) {
              console.error('Error loading partner:', error)
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }
    loadUserData()
  }, [user])

  // Get date range based on selected filter
  const getDateRange = useCallback(() => {
    const now = new Date()
    let startDate, endDate

    switch (dateRange) {
      case DATE_RANGES.TODAY:
        startDate = startOfDay(now)
        endDate = endOfDay(now)
        break
      case DATE_RANGES.THIS_WEEK:
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
        break
      case DATE_RANGES.THIS_MONTH:
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case DATE_RANGES.LAST_60_DAYS:
        startDate = subDays(now, ARCHIVE_DAYS)
        endDate = now
        break
      case DATE_RANGES.CUSTOM:
        startDate = startOfDay(customStartDate)
        endDate = endOfDay(customEndDate)
        break
      default:
        startDate = subDays(now, ARCHIVE_DAYS)
        endDate = now
    }

    return { startDate, endDate }
  }, [dateRange, customStartDate, customEndDate])

  // Calculate statistics
  const calculateStatistics = useCallback((tasks) => {
    if (!currentUser) return

    const { startDate, endDate } = getDateRange()
    const now = new Date()

    // Filter tasks by user
    let userTasks = tasks
    
    if (selectedUser !== 'all') {
      const targetEmail = selectedUser === 'myself' 
        ? currentUser.email 
        : (partner?.email || currentUser.partner_email)

      if (!targetEmail) {
        setStats(null)
        return
      }

      userTasks = tasks.filter(task => {
        const assignedTo = task.assigned_to || ''
        const completedBy = task.completed_by || ''
        const createdBy = task.created_by || ''

        if (assignedTo === 'together') {
          return true
        }

        return assignedTo === targetEmail || 
               completedBy === targetEmail || 
               createdBy === targetEmail
      })
    } else {
      const userEmails = [currentUser.email]
      if (partner?.email) userEmails.push(partner.email)
      if (currentUser.partner_email) userEmails.push(currentUser.partner_email)

      userTasks = tasks.filter(task => {
        const assignedTo = task.assigned_to || ''
        const completedBy = task.completed_by || ''
        const createdBy = task.created_by || ''

        if (assignedTo === 'together') return true
        return userEmails.includes(assignedTo) || 
               userEmails.includes(completedBy) || 
               userEmails.includes(createdBy)
      })
    }

    // Filter tasks by date range
    const filteredTasks = userTasks.filter(task => {
      if (task.status === 'completed' || task.is_archived) {
        const completionDate = task.completion_date || task.archived_date
        if (!completionDate) return false
        const date = typeof completionDate === 'string' 
          ? parseISO(completionDate) 
          : new Date(completionDate)
        return isWithinInterval(date, { start: startDate, end: endDate })
      }
      
      const taskDate = task.due_date || task.created_date
      if (!taskDate) return false
      const date = typeof taskDate === 'string' 
        ? parseISO(taskDate) 
        : new Date(taskDate)
      return isWithinInterval(date, { start: startDate, end: endDate })
    })

    const statsData = {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      overdueTasksList: [],
      notPerformedTasks: 0,
      completionRate: 0,
      averageCompletionTime: 0,
      byCategory: {},
      byPriority: {},
      completionTimeline: [],
      recentCompletions: [],
      incompleteTasks: []
    }

    statsData.totalTasks = filteredTasks.length

    // Categorize tasks
    filteredTasks.forEach(task => {
      const isCompleted = task.status === 'completed' || task.is_archived
      const isPending = task.status === 'pending'
      const isInProgress = task.status === 'in_progress'
      
      let isOverdue = false
      if (task.due_date && !isCompleted) {
        const dueDate = typeof task.due_date === 'string' 
          ? parseISO(task.due_date) 
          : new Date(task.due_date)
        isOverdue = dueDate < now
      }

      if (isCompleted) {
        statsData.completedTasks++
        
        if (task.completion_date || task.archived_date) {
          const completionDate = task.completion_date || task.archived_date
          const date = typeof completionDate === 'string' 
            ? parseISO(completionDate) 
            : new Date(completionDate)
          
          if (isWithinInterval(date, { start: startDate, end: endDate })) {
            statsData.recentCompletions.push({ task, date })
          }
        }
      } else if (isPending) {
        statsData.pendingTasks++
      } else if (isInProgress) {
        statsData.inProgressTasks++
      }

      if (isOverdue && !isCompleted) {
        statsData.overdueTasks++
        statsData.notPerformedTasks++
        statsData.overdueTasksList.push({
          task,
          dueDate: task.due_date ? (typeof task.due_date === 'string' ? parseISO(task.due_date) : new Date(task.due_date)) : null,
          daysOverdue: task.due_date ? differenceInDays(now, typeof task.due_date === 'string' ? parseISO(task.due_date) : new Date(task.due_date)) : 0
        })
      }
      
      if (!isCompleted) {
        statsData.incompleteTasks.push({
          task,
          dueDate: task.due_date ? (typeof task.due_date === 'string' ? parseISO(task.due_date) : new Date(task.due_date)) : null,
          assignedTo: task.assigned_to || '',
          status: task.status,
          priority: task.priority || 'medium',
          category: task.category || 'other'
        })
      }

      const category = task.category || 'other'
      if (!statsData.byCategory[category]) {
        statsData.byCategory[category] = {
          total: 0,
          completed: 0,
          pending: 0,
          overdue: 0
        }
      }
      statsData.byCategory[category].total++
      if (isCompleted) statsData.byCategory[category].completed++
      if (isPending) statsData.byCategory[category].pending++
      if (isOverdue && !isCompleted) statsData.byCategory[category].overdue++

      const priority = task.priority || 'medium'
      if (!statsData.byPriority[priority]) {
        statsData.byPriority[priority] = {
          total: 0,
          completed: 0,
          pending: 0,
          overdue: 0
        }
      }
      statsData.byPriority[priority].total++
      if (isCompleted) statsData.byPriority[priority].completed++
      if (isPending) statsData.byPriority[priority].pending++
      if (isOverdue && !isCompleted) statsData.byPriority[priority].overdue++
    })

    const totalWithStatus = statsData.completedTasks + statsData.pendingTasks + statsData.inProgressTasks
    if (totalWithStatus > 0) {
      statsData.completionRate = Math.round((statsData.completedTasks / totalWithStatus) * 100)
    }

    const completedWithDates = statsData.recentCompletions.filter(c => {
      if (!c.task.created_date) return false
      const createdDate = typeof c.task.created_date === 'string' 
        ? parseISO(c.task.created_date) 
        : new Date(c.task.created_date)
      return createdDate && c.date
    })

    if (completedWithDates.length > 0) {
      const totalDays = completedWithDates.reduce((sum, c) => {
        const createdDate = typeof c.task.created_date === 'string' 
          ? parseISO(c.task.created_date) 
          : new Date(c.task.created_date)
        return sum + differenceInDays(c.date, createdDate)
      }, 0)
      statsData.averageCompletionTime = Math.round(totalDays / completedWithDates.length)
    }

    const timelineMap = {}
    const daysDiff = differenceInDays(endDate, startDate)
    for (let i = 0; i <= daysDiff; i++) {
      const date = subDays(endDate, daysDiff - i)
      const dateKey = format(date, 'yyyy-MM-dd')
      timelineMap[dateKey] = 0
    }

    statsData.recentCompletions.forEach(c => {
      const dateKey = format(c.date, 'yyyy-MM-dd')
      if (timelineMap[dateKey] !== undefined) {
        timelineMap[dateKey]++
      }
    })

    statsData.completionTimeline = Object.entries(timelineMap)
      .map(([date, count]) => ({ date, count }))

    setStats(statsData)
  }, [currentUser, partner, selectedUser, getDateRange])

  // Load tasks
  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const dataSource = await getDataSource(user.uid)
      if (!dataSource.success) {
        throw new Error(dataSource.error)
      }

      const tasksRef = ref(database, `${dataSource.path}/tasks`)
      const snapshot = await get(tasksRef)
      
      if (!snapshot.exists()) {
        setAllTasks([])
        calculateStatistics([])
        return
      }

      const tasksData = snapshot.val() || {}
      const allTasksData = Object.entries(tasksData).map(([id, taskData]) => ({
        id,
        ...taskData
      }))

      // Filter archived tasks within 60 days
      const now = new Date()
      const filteredTasks = allTasksData.filter(task => {
        if (task.is_archived && task.archived_date) {
          const archivedDate = typeof task.archived_date === 'string' 
            ? parseISO(task.archived_date) 
            : new Date(task.archived_date)
          return differenceInDays(now, archivedDate) <= ARCHIVE_DAYS
        }
        return true
      })

      setAllTasks(filteredTasks)
      calculateStatistics(filteredTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [user, getDataSource, calculateStatistics])

  useEffect(() => {
    if (currentUser) {
      loadTasks()
    }
  }, [currentUser, selectedUser, dateRange, customStartDate, customEndDate, loadTasks])

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case DATE_RANGES.TODAY:
        return 'Today'
      case DATE_RANGES.THIS_WEEK:
        return 'This Week'
      case DATE_RANGES.THIS_MONTH:
        return 'This Month'
      case DATE_RANGES.LAST_60_DAYS:
        return 'Last 60 days'
      case DATE_RANGES.CUSTOM:
        return `${format(customStartDate, 'MMM d')} - ${format(customEndDate, 'MMM d')}`
      default:
        return 'Last 60 days'
    }
  }

  if (isLoading && !stats) {
    return (
      <div className="management-container">
        <div className="loading-spinner"></div>
        <p>Loading statistics...</p>
      </div>
    )
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h1>📊 Management</h1>
          <p className="subtitle">View comprehensive statistics for the last {ARCHIVE_DAYS} days</p>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="nav-link">
            👤 Profile
          </Link>
          <button onClick={handleLogout} className="logout-button">
            Sign Out
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-container">
        {/* User Filter */}
        <div className="filter-section">
          <label className="filter-label">View statistics for</label>
          <div className="filter-buttons">
            <button
              className={`filter-button ${selectedUser === 'myself' ? 'active' : ''}`}
              onClick={() => setSelectedUser('myself')}
            >
              👤 {currentUser?.full_name || currentUser?.email || 'Myself'}
            </button>
            {partner && (
              <button
                className={`filter-button ${selectedUser === 'partner' ? 'active' : ''}`}
                onClick={() => setSelectedUser('partner')}
              >
                👥 {partner?.full_name || partner?.email || 'My Partner'}
              </button>
            )}
            <button
              className={`filter-button ${selectedUser === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedUser('all')}
            >
              👨‍👩‍👧 All
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="filter-section">
          <label className="filter-label">Date Range</label>
          <div className="date-range-buttons">
            <button
              className={`date-range-button ${dateRange === DATE_RANGES.TODAY ? 'active' : ''}`}
              onClick={() => setDateRange(DATE_RANGES.TODAY)}
            >
              Today
            </button>
            <button
              className={`date-range-button ${dateRange === DATE_RANGES.THIS_WEEK ? 'active' : ''}`}
              onClick={() => setDateRange(DATE_RANGES.THIS_WEEK)}
            >
              This Week
            </button>
            <button
              className={`date-range-button ${dateRange === DATE_RANGES.THIS_MONTH ? 'active' : ''}`}
              onClick={() => setDateRange(DATE_RANGES.THIS_MONTH)}
            >
              This Month
            </button>
            <button
              className={`date-range-button ${dateRange === DATE_RANGES.LAST_60_DAYS ? 'active' : ''}`}
              onClick={() => setDateRange(DATE_RANGES.LAST_60_DAYS)}
            >
              Last 60 Days
            </button>
            <button
              className={`date-range-button ${dateRange === DATE_RANGES.CUSTOM ? 'active' : ''}`}
              onClick={() => setDateRange(DATE_RANGES.CUSTOM)}
            >
              Custom
            </button>
          </div>

          {dateRange === DATE_RANGES.CUSTOM && (
            <div className="custom-date-container">
              <div className="custom-date-input">
                <label>From:</label>
                <input
                  type="date"
                  value={customStartDate.toISOString().split('T')[0]}
                  onChange={(e) => setCustomStartDate(new Date(e.target.value))}
                  max={customEndDate.toISOString().split('T')[0]}
                />
              </div>
              <div className="custom-date-input">
                <label>To:</label>
                <input
                  type="date"
                  value={customEndDate.toISOString().split('T')[0]}
                  onChange={(e) => setCustomEndDate(new Date(e.target.value))}
                  min={customStartDate.toISOString().split('T')[0]}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {!stats ? (
        <div className="empty-state">
          <p>No data available</p>
          <p className="empty-subtitle">No tasks found for the selected user in the selected date range.</p>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="stats-section">
            <h2 className="section-title">Overview</h2>
            <div className="stats-grid">
              <div className="stat-card completed">
                <div className="stat-header">
                  <span className="stat-icon">✅</span>
                  <span className="stat-title">Completed</span>
                </div>
                <div className="stat-value">{stats.completedTasks}</div>
                <div className="stat-subtitle">{getDateRangeLabel()}</div>
              </div>
              <div className="stat-card pending">
                <div className="stat-header">
                  <span className="stat-icon">⏳</span>
                  <span className="stat-title">Pending</span>
                </div>
                <div className="stat-value">{stats.pendingTasks}</div>
                <div className="stat-subtitle">Active tasks</div>
              </div>
              <div className="stat-card overdue">
                <div className="stat-header">
                  <span className="stat-icon">⚠️</span>
                  <span className="stat-title">Overdue</span>
                </div>
                <div className="stat-value">{stats.overdueTasks}</div>
                <div className="stat-subtitle">Not Performed</div>
              </div>
              <div className="stat-card rate">
                <div className="stat-header">
                  <span className="stat-icon">📈</span>
                  <span className="stat-title">Completion Rate</span>
                </div>
                <div className="stat-value">{stats.completionRate}%</div>
                <div className="stat-subtitle">of total tasks</div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="stats-section">
            <h2 className="section-title">Detailed Statistics</h2>
            <div className="detailed-stats-card">
              <div className="detailed-stat-row">
                <span>📋 Total Tasks</span>
                <span className="stat-value-small">{stats.totalTasks}</span>
              </div>
              <div className="detailed-stat-row">
                <span>▶️ In Progress</span>
                <span className="stat-value-small">{stats.inProgressTasks}</span>
              </div>
              <div className="detailed-stat-row">
                <span>⏱️ Avg Completion Time</span>
                <span className="stat-value-small">
                  {stats.averageCompletionTime > 0 
                    ? `${stats.averageCompletionTime} days`
                    : 'None'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Overdue Tasks */}
          {stats.overdueTasksList && stats.overdueTasksList.length > 0 && (
            <div className="stats-section">
              <h2 className="section-title">
                Overdue Tasks ({stats.overdueTasksList.length})
              </h2>
              <div className="tasks-list-card">
                {stats.overdueTasksList
                  .sort((a, b) => {
                    if (a.daysOverdue !== b.daysOverdue) {
                      return b.daysOverdue - a.daysOverdue
                    }
                    if (a.dueDate && b.dueDate) {
                      return a.dueDate - b.dueDate
                    }
                    return 0
                  })
                  .map((item, index) => (
                    <div key={index} className="task-item">
                      <div className="task-item-header">
                        <span className="task-icon overdue-icon">⚠️</span>
                        <div className="task-item-content">
                          <h3 className="task-title">{item.task.title}</h3>
                          <div className="task-meta">
                            {item.dueDate && (
                              <span className="task-badge">
                                📅 {format(item.dueDate, 'MMM d, yyyy')}
                                <span className="overdue-badge">
                                  {item.daysOverdue} days overdue
                                </span>
                              </span>
                            )}
                            <span className="task-badge">
                              🏷️ {item.task.category || 'other'}
                            </span>
                            {item.task.priority && (
                              <span className={`task-badge priority-${item.task.priority}`}>
                                {item.task.priority}
                              </span>
                            )}
                          </div>
                          {item.task.description && (
                            <p className="task-description">{item.task.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Incomplete Tasks */}
          {stats.incompleteTasks && stats.incompleteTasks.length > 0 && (
            <div className="stats-section">
              <h2 className="section-title">
                Incomplete Tasks ({stats.incompleteTasks.filter(item => 
                  !stats.overdueTasksList?.some(overdue => overdue.task.id === item.task.id)
                ).length})
              </h2>
              <div className="tasks-list-card">
                {stats.incompleteTasks
                  .filter(item => !stats.overdueTasksList?.some(overdue => overdue.task.id === item.task.id))
                  .sort((a, b) => {
                    if (a.dueDate && b.dueDate) {
                      return a.dueDate - b.dueDate
                    }
                    if (a.dueDate) return -1
                    if (b.dueDate) return 1
                    const priorityOrder = { high: 3, medium: 2, low: 1 }
                    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
                  })
                  .map((item, index) => (
                    <div key={index} className="task-item">
                      <div className="task-item-header">
                        <span className="task-icon">
                          {item.status === 'in_progress' ? '▶️' : '⏳'}
                        </span>
                        <div className="task-item-content">
                          <h3 className="task-title">{item.task.title}</h3>
                          <div className="task-meta">
                            {item.dueDate && (
                              <span className="task-badge">
                                📅 {format(item.dueDate, 'MMM d, yyyy')}
                              </span>
                            )}
                            <span className="task-badge">
                              🏷️ {item.category}
                            </span>
                            <span className={`task-badge priority-${item.priority}`}>
                              {item.priority}
                            </span>
                            <span className="task-badge">
                              {item.status === 'in_progress' ? 'In Progress' : 'Pending'}
                            </span>
                          </div>
                          {item.task.description && (
                            <p className="task-description">{item.task.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          {Object.keys(stats.byCategory).length > 0 && (
            <div className="stats-section">
              <h2 className="section-title">By Category</h2>
              {Object.entries(stats.byCategory).map(([category, data]) => {
                const completionRate = data.total > 0 
                  ? Math.round((data.completed / data.total) * 100) 
                  : 0
                return (
                  <div key={category} className="category-card">
                    <div className="category-header">
                      <h3 className="category-name">{category}</h3>
                      <span className="category-total">{data.total} tasks</span>
                    </div>
                    <div className="category-stats">
                      <span className="category-stat">
                        ✅ {data.completed} completed
                      </span>
                      <span className="category-stat">
                        ⏳ {data.pending} pending
                      </span>
                      {data.overdue > 0 && (
                        <span className="category-stat">
                          ⚠️ {data.overdue} overdue
                        </span>
                      )}
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">{completionRate}% complete</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Priority Breakdown */}
          {Object.keys(stats.byPriority).length > 0 && (
            <div className="stats-section">
              <h2 className="section-title">By Priority</h2>
              {Object.entries(stats.byPriority).map(([priority, data]) => {
                const completionRate = data.total > 0 
                  ? Math.round((data.completed / data.total) * 100) 
                  : 0
                return (
                  <div key={priority} className="category-card">
                    <div className="category-header">
                      <h3 className="category-name">{priority}</h3>
                      <span className="category-total">{data.total} tasks</span>
                    </div>
                    <div className="category-stats">
                      <span className="category-stat">
                        ✅ {data.completed} completed
                      </span>
                      <span className="category-stat">
                        ⏳ {data.pending} pending
                      </span>
                      {data.overdue > 0 && (
                        <span className="category-stat">
                          ⚠️ {data.overdue} overdue
                        </span>
                      )}
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">{completionRate}% complete</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Recent Completions */}
          {stats.recentCompletions.length > 0 && (
            <div className="stats-section">
              <h2 className="section-title">Recent Completions</h2>
              <div className="completions-list-card">
                {stats.recentCompletions
                  .sort((a, b) => b.date - a.date)
                  .slice(0, 10)
                  .map((item, index) => (
                    <div key={index} className="completion-item">
                      <span className="completion-icon">✅</span>
                      <div className="completion-content">
                        <h4 className="completion-title">{item.task.title}</h4>
                        <span className="completion-date">
                          {format(item.date, 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Management

