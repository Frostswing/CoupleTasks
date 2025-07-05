import React, { useState } from "react";
import { Task } from "@/entities/Task";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import TaskForm from "../components/tasks/TaskForm";

export default function AddTask() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (taskData) => {
    setIsSubmitting(true);
    try {
      await Task.create(taskData);
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(createPageUrl("Dashboard"));
  };

  return (
    <div className="p-6 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={handleCancel}
            className="border-pink-200 hover:bg-pink-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Add New Task</h1>
            <p className="text-gray-600 mt-1">Create a new task for you and your partner</p>
          </div>
        </motion.div>

        <TaskForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          title="Create New Task"
        />
        
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                <p className="text-gray-700 font-medium">Creating your task...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}