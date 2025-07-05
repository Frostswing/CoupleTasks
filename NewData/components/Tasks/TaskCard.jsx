
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Heart,
  User,
  Edit3,
  Repeat
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categoryColors = {
  household: "bg-blue-100 text-blue-700 border-blue-200",
  errands: "bg-green-100 text-green-700 border-green-200",
  planning: "bg-purple-100 text-purple-700 border-purple-200",
  finance: "bg-yellow-100 text-yellow-700 border-yellow-200",
  health: "bg-red-100 text-red-700 border-red-200",
  social: "bg-pink-100 text-pink-700 border-pink-200",
  personal: "bg-indigo-100 text-indigo-700 border-indigo-200",
  other: "bg-gray-100 text-gray-700 border-gray-200"
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-orange-100 text-orange-700",
  high: "bg-red-100 text-red-700"
};

export default function TaskCard({ task, onStatusChange, onEdit, onSubtaskToggle, currentUser }) {
  const isAssignedToMe = task.assigned_to === currentUser?.email;
  const isCompleted = task.status === 'completed';
  
  const allSubtasksCompleted = task.subtasks?.every(st => st.is_completed) ?? true;
  
  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getAssignedUserInitials = (email) => {
    if (!email) return '?';
    return email.split('@')[0].charAt(0).toUpperCase();
  };

  const handleMainTaskToggle = () => {
    if (!allSubtasksCompleted) {
      // Optionally show a toast or alert here
      return;
    }
    onStatusChange(task, 'completed');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group"
    >
      <Card className={`material-container border-0 transition-all duration-300 ${isAssignedToMe ? 'ring-2 ring-purple-200' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <button onClick={handleMainTaskToggle} disabled={!allSubtasksCompleted} className={`mt-1 hover:scale-110 transition-transform duration-200 ${!allSubtasksCompleted ? 'cursor-not-allowed' : ''}`}>
                {getStatusIcon()}
              </button>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{task.title}</h3>
                
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge className={categoryColors[task.category]} variant="secondary">{task.category}</Badge>
                  <Badge className={priorityColors[task.priority]} variant="secondary">{task.priority}</Badge>
                  {isAssignedToMe && (
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200" variant="secondary">
                      <Heart className="w-3 h-3 mr-1" />
                      For you
                    </Badge>
                  )}
                  {task.recurrence_rule !== 'none' && (
                     <Badge className="bg-blue-100 text-blue-700 border-blue-200" variant="secondary">
                      <Repeat className="w-3 h-3 mr-1" />
                      {task.recurrence_rule}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400">
                <AvatarFallback className="text-white text-sm font-medium">
                  {getAssignedUserInitials(task.assigned_to)}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(task)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-purple-50 material-button h-10 w-10"
              >
                <Edit3 className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {task.description && (
            <p className="text-gray-600 text-sm mb-3 leading-relaxed">
              {task.description}
            </p>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-2 mb-3">
              {task.subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
                  <Checkbox
                    id={`subtask-${task.id}-${index}`}
                    checked={subtask.is_completed}
                    onCheckedChange={(checked) => onSubtaskToggle(task.id, index, checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor={`subtask-${task.id}-${index}`} className={`text-sm ${subtask.is_completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                    {subtask.title}
                  </label>
                </div>
              ))}
            </div>
          )}
            
          {(task.due_date || task.due_time) && (
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {task.due_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Due {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                </div>
              )}
              {task.due_time && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{task.due_time}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
