import { database } from "../firebase/config";
import { ref, set, onValue, push, remove, update } from "firebase/database";

/**
 * קבלת כל המטלות מהמסד נתונים
 * @param {function} callback - פונקציה שתתבצע כאשר המידע מתקבל
 * @returns {function} - פונקציית הסרת האזנה
 */
export const subscribeTasks = (callback) => {
  console.log("Subscribing to tasks...");
  const tasksRef = ref(database, "tasks");

  const unsubscribe = onValue(
    tasksRef,
    (snapshot) => {
      console.log("Received tasks data:", snapshot.exists());
      const data = snapshot.val() || {};
      // המרת אובייקט לרשימה עם id
      const tasksList = Object.entries(data).map(([id, values]) => ({
        id,
        ...values,
      }));

      console.log("Tasks list:", tasksList.length);
      callback(tasksList);
    },
    (error) => {
      console.error("שגיאה בטעינת מטלות:", error);
    }
  );

  return unsubscribe;
};

/**
 * הוספת מטלה חדשה
 * @param {Object} task - פרטי המטלה
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const addTask = async (task) => {
  try {
    console.log("Adding task:", task);
    const tasksRef = ref(database, "tasks");
    const newTaskRef = push(tasksRef);

    await set(newTaskRef, {
      title: task.title,
      description: task.description || "",
      completed: false,
      createdAt: new Date().toISOString(),
    });

    console.log("Task added with ID:", newTaskRef.key);
    return { success: true, id: newTaskRef.key };
  } catch (error) {
    console.error("שגיאה בהוספת מטלה:", error);
    return { success: false, error };
  }
};

/**
 * עדכון מטלה קיימת
 * @param {string} taskId - מזהה המטלה
 * @param {Object} taskData - נתוני המטלה לעדכון
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const updateTask = async (taskId, taskData) => {
  try {
    const taskRef = ref(database, `tasks/${taskId}`);
    await update(taskRef, taskData);

    return { success: true };
  } catch (error) {
    console.error("שגיאה בעדכון מטלה:", error);
    return { success: false, error };
  }
};

/**
 * מחיקת מטלה
 * @param {string} taskId - מזהה המטלה למחיקה
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const deleteTask = async (taskId) => {
  try {
    const taskRef = ref(database, `tasks/${taskId}`);
    await remove(taskRef);

    return { success: true };
  } catch (error) {
    console.error("שגיאה במחיקת מטלה:", error);
    return { success: false, error };
  }
};

/**
 * סימון מטלה כמושלמת או לא מושלמת
 * @param {string} taskId - מזהה המטלה
 * @param {boolean} isCompleted - האם המטלה הושלמה
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const toggleTaskCompletion = async (taskId, isCompleted) => {
  return updateTask(taskId, { completed: isCompleted });
};
