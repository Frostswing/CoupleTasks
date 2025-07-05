
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Heart, User, X, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { User as UserEntity } from "@/entities/User";

export default function TaskForm({ task, onSubmit, onCancel, title = "Create New Task" }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "household",
    priority: "medium",
    assigned_to: "",
    due_date: null,
    due_time: "",
    recurrence_rule: "none",
    subtasks: [],
    ...task
  });
  
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [newSubtask, setNewSubtask] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const me = await UserEntity.me();
      setCurrentUser(me);

      const userList = [me];

      if (me.partner_email) {
        const partnerResults = await UserEntity.filter({ email: me.partner_email });
        if (partnerResults.length > 0) {
          userList.push(partnerResults[0]);
        }
      }
      
      setUsers(userList);
      
      // If no assignment and this is a new task, assign to current user
      if (!task && !formData.assigned_to) {
        setFormData(prev => ({ ...prev, assigned_to: me.email }));
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      handleInputChange('subtasks', [
        ...(formData.subtasks || []),
        { title: newSubtask.trim(), is_completed: false }
      ]);
      setNewSubtask("");
    }
  };

  const removeSubtask = (index) => {
    handleInputChange('subtasks', (formData.subtasks || []).filter((_, i) => i !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="material-container border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Heart className="w-6 h-6 text-pink-500" />
            {title}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Task Title
              </Label>
              <Input
                id="title"
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="material-container border-0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Add details about this task..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="material-container border-0 h-24"
              />
            </div>

            {/* Subtasks */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Sub-tasks</Label>
              <div className="space-y-2">
                {formData.subtasks?.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={subtask.title}
                      onChange={(e) => {
                        const newSubtasks = [...formData.subtasks];
                        newSubtasks[index].title = e.target.value;
                        handleInputChange('subtasks', newSubtasks);
                      }}
                      className="material-container border-0 h-10"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSubtask(index)} className="h-10 w-10">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add a new sub-task..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                  className="material-container border-0 h-10"
                />
                <Button type="button" onClick={addSubtask} className="material-button bg-purple-100 text-purple-700 hover:bg-purple-200">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start material-container border-0 h-12">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ? format(new Date(formData.due_date), 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 material-container border-0">
                    <Calendar
                      mode="single"
                      selected={formData.due_date ? new Date(formData.due_date) : undefined}
                      onSelect={(date) => handleInputChange('due_date', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_time" className="text-sm font-medium text-gray-700">Due Time</Label>
                <Input
                  id="due_time"
                  type="time"
                  value={formData.due_time}
                  onChange={(e) => handleInputChange('due_time', e.target.value)}
                  className="material-container border-0 h-12"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className="material-container border-0 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="material-container border-0">
                    <SelectItem value="household">Household</SelectItem>
                    <SelectItem value="errands">Errands</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger className="material-container border-0 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="material-container border-0">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned To */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Assigned To</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => handleInputChange('assigned_to', value)}
                >
                  <SelectTrigger className="material-container border-0 h-12">
                    <SelectValue placeholder="Select partner" />
                  </SelectTrigger>
                  <SelectContent className="material-container border-0">
                    {users.map((user) => (
                      <SelectItem key={user.email} value={user.email}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {user.full_name || user.email}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Recurrence</Label>
              <Select value={formData.recurrence_rule} onValueChange={(value) => handleInputChange('recurrence_rule', value)}>
                <SelectTrigger className="material-container border-0 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="material-container border-0">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1 material-button border-gray-300 hover:bg-gray-50 h-12">Cancel</Button>
              <Button type="submit" className="flex-1 material-button bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white h-12">
                {task ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
