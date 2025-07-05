
import React, { useState, useEffect, useCallback } from "react";
import { Task } from "@/entities/Task";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Heart, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { add, addDays, addMonths, addWeeks } from 'date-fns';

import TaskCard from "../components/tasks/TaskCard";
import TaskFilters from "../components/tasks/TaskFilters";
import { Card, CardContent } from "@/components/ui/card"; // Added import for Card components
import EditTaskDialog from "../components/tasks/EditTaskDialog";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: 'pending', // Default to pending
    category: 'all',
    priority: 'all',
    assigned_to: 'all'
  });

  const loadData = useCallback(async () => {
    // Only set loading true on initial load
    if (tasks.length === 0) setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      let taskList = [];
      const userEmails = [user.email];
      if (user.partner_email) {
        userEmails.push(user.partner_email);
      }

      // Fetch tasks that are not archived
      const allTasks = await Task.filter({ is_archived: { '$ne': true } }, '-updated_date');
      taskList = allTasks.filter(t => userEmails.includes(t.created_by));

      setTasks(taskList);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tasks.length]);


  useEffect(() => {
    loadData();

    // Auto-refresh every 30 seconds to sync
    const intervalId = setInterval(() => {
      loadData();
    }, 30000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [loadData]);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters, currentUser]);

  const applyFilters = () => {
    let filtered = [...tasks];

    // Filter out completed tasks from view, they get archived immediately
    filtered = filtered.filter(task => task.status !== 'completed');
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(task => task.category === filters.category);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.assigned_to === 'me' && currentUser) {
      filtered = filtered.filter(task => task.assigned_to === currentUser.email);
    }

    setFilteredTasks(filtered);
  };

  const getNextDueDate = (currentDueDate, rule) => {
    const date = currentDueDate ? new Date(currentDueDate) : new Date();
    switch (rule) {
      case 'daily': return addDays(date, 1);
      case 'weekly': return addWeeks(date, 1);
      case 'monthly': return addMonths(date, 1);
      default: return null;
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    if (newStatus !== 'completed') {
      try {
        await Task.update(task.id, { status: newStatus });
        loadData();
      } catch (error) { console.error("Error updating task status:", error); }
      return;
    }

    // Handle task completion and archiving
    try {
      // Archive the original task
      await Task.update(task.id, {
        status: 'completed',
        is_archived: true,
        archived_date: new Date().toISOString(),
        completion_date: new Date().toISOString()
      });

      // If it's a recurring task, create the next instance
      if (task.recurrence_rule && task.recurrence_rule !== 'none') {
        const nextDueDate = getNextDueDate(task.due_date, task.recurrence_rule);
        
        const newTask = {
          ...task,
          due_date: nextDueDate ? nextDueDate.toISOString().split('T')[0] : null,
          status: 'pending',
          is_archived: false,
          archived_date: null,
          completion_date: null,
          subtasks: task.subtasks?.map(st => ({ ...st, is_completed: false })) || []
        };
        delete newTask.id; // Remove id to create a new record
        
        await Task.create(newTask);
      }
      
      loadData();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleSubtaskToggle = async (taskId, subtaskIndex, isCompleted) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newSubtasks = [...task.subtasks];
    newSubtasks[subtaskIndex].is_completed = isCompleted;
    
    try {
      await Task.update(taskId, { subtasks: newSubtasks });
      loadData();
    } catch (error) {
      console.error("Error updating subtask:", error);
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      await Task.update(editingTask.id, taskData);
      setEditingTask(null);
      loadData();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const getTaskCounts = () => {
    const counts = {
      byStatus: {},
      byCategory: {},
      byAssignee: {}
    };

    tasks.forEach(task => {
      counts.byStatus[task.status] = (counts.byStatus[task.status] || 0) + 1;
      counts.byCategory[task.category] = (counts.byCategory[task.category] || 0) + 1;
      counts.byAssignee[task.assigned_to] = (counts.byAssignee[task.assigned_to] || 0) + 1;
    });

    return counts;
  };

  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const myTasks = tasks.filter(t => t.assigned_to === currentUser?.email).length;
    const overdue = tasks.filter(t => 
      t.due_date && 
      new Date(t.due_date) < new Date() && 
      t.status !== 'completed'
    ).length;

    return { total, completed, myTasks, overdue };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {currentUser?.full_name || 'Partner'}! 
              </h1>
              <p className="text-gray-600">Let's see what you and your partner need to tackle today</p>
            </div>
            <Link to={createPageUrl("AddTask")}>
              <Button className="material-fab bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white h-14 px-6">
                <Plus className="w-5 h-5 mr-2" />
                Add Task
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="material-container border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="material-container border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-xl font-bold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="material-container border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your Tasks</p>
                  <p className="text-xl font-bold text-gray-900">{stats.myTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="material-container border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-xl font-bold text-gray-900">{stats.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <TaskFilters 
            filters={filters}
            onFilterChange={setFilters}
            taskCounts={getTaskCounts()}
            currentUser={currentUser}
          />
        </div>

        {/* Tasks Grid */}
        <div className="grid gap-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-6">
                {tasks.length === 0 
                  ? "Start by creating your first shared task together!" 
                  : "Try adjusting your filters to see more tasks."
                }
              </p>
              <Link to={createPageUrl("AddTask")}>
                <Button className="material-fab bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Task
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onEdit={setEditingTask}
                    onSubtaskToggle={handleSubtaskToggle}
                    currentUser={currentUser}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      <EditTaskDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(isOpen) => !isOpen && setEditingTask(null)}
        onUpdateTask={handleUpdateTask}
      />
    </div>
  );
}
