import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TaskForm from "./TaskForm";

export default function EditTaskDialog({ task, open, onOpenChange, onUpdateTask }) {
    if (!task) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="material-container border-0 max-w-2xl">
                <TaskForm
                    task={task}
                    onSubmit={onUpdateTask}
                    onCancel={() => onOpenChange(false)}
                    title="Edit Task"
                />
            </DialogContent>
        </Dialog>
    );
}