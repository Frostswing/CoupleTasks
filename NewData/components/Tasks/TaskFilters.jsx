import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Heart, User, CheckCircle } from "lucide-react";

export default function TaskFilters({ 
  filters, 
  onFilterChange, 
  taskCounts,
  currentUser 
}) {
  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const getMyTasksCount = () => {
    return taskCounts.byAssignee?.[currentUser?.email] || 0;
  };

  const getCompletedCount = () => {
    return taskCounts.byStatus?.completed || 0;
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-0 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-400" />
        <h3 className="font-semibold text-gray-900">Filters</h3>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-4">
        <Button
          variant={filters.assigned_to === 'me' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('assigned_to', filters.assigned_to === 'me' ? 'all' : 'me')}
          className={`transition-all duration-200 ${
            filters.assigned_to === 'me' 
              ? 'bg-pink-500 hover:bg-pink-600 text-white' 
              : 'border-pink-200 hover:bg-pink-50 hover:border-pink-300'
          }`}
        >
          <Heart className="w-4 h-4 mr-2" />
          My Tasks
          {getMyTasksCount() > 0 && (
            <Badge className="ml-2 bg-white/20 text-inherit">
              {getMyTasksCount()}
            </Badge>
          )}
        </Button>
        
        <Button
          variant={filters.status === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('status', filters.status === 'completed' ? 'all' : 'completed')}
          className={`transition-all duration-200 ${
            filters.status === 'completed' 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'border-green-200 hover:bg-green-50 hover:border-green-300'
          }`}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Completed
          {getCompletedCount() > 0 && (
            <Badge className="ml-2 bg-white/20 text-inherit">
              {getCompletedCount()}
            </Badge>
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="bg-white/80 border-pink-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-sm">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger className="bg-white/80 border-pink-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-sm">
              <SelectItem value="all">All Categories</SelectItem>
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
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
            <SelectTrigger className="bg-white/80 border-pink-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-sm">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}