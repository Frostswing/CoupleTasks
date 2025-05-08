import { database } from "../firebase/config";
import { ref, set, onValue, push, remove, update } from "firebase/database";
import { getCurrentUser, getDataSource } from "./userService";

/**
 * קבלת כל המטלות מהמסד נתונים
 * @param {function} callback - פונקציה שתתבצע כאשר המידע מתקבל
 * @returns {function} - פונקציית הסרת האזנה
 */
export const subscribeTasks = (callback) => {
  console.log("Subscribing to tasks...");
  const user = getCurrentUser();

  if (!user) {
    console.log("No user logged in, can't subscribe to tasks");
    callback([], { isShared: false, path: null });
    return () => {};
  }

  // זיהוי אם צריך לקחת רשימות מהמסד המשותף או האישי
  let unsubscribeFunc = () => {};

  getDataSource(user.uid).then((dataSource) => {
    if (!dataSource.success) {
      console.error("Error getting data source:", dataSource.error);
      callback([], { isShared: false, path: null });
      return;
    }

    console.log(`Using data source: ${dataSource.path}`);
    const tasksRef = ref(database, `${dataSource.path}/tasks`);

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
        // העברת מקור הנתונים יחד עם רשימת המטלות
        callback(tasksList, {
          isShared: dataSource.isShared,
          path: dataSource.path,
        });
      },
      (error) => {
        console.error("שגיאה בטעינת מטלות:", error);
        callback([], { isShared: false, path: null });
      }
    );

    unsubscribeFunc = unsubscribe;
  });

  // פונקציית הסרת האזנה - תיקרא כאשר הקומפוננטה תתפרק
  return () => {
    unsubscribeFunc();
  };
};

/**
 * הוספת מטלה חדשה
 * @param {Object} task - פרטי המטלה
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const addTask = async (task) => {
  try {
    console.log("Adding task:", task);
    const user = getCurrentUser();

    if (!user) {
      return { success: false, error: "עליך להתחבר לפני הוספת מטלות" };
    }

    const dataSource = await getDataSource(user.uid);
    if (!dataSource.success) {
      return { success: false, error: dataSource.error };
    }

    const tasksRef = ref(database, `${dataSource.path}/tasks`);
    const newTaskRef = push(tasksRef);

    await set(newTaskRef, {
      title: task.title,
      description: task.description || "",
      completed: false,
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
    });

    console.log("Task added with ID:", newTaskRef.key);
    return { success: true, id: newTaskRef.key };
  } catch (error) {
    console.error("שגיאה בהוספת מטלה:", error);
    return { success: false, error: error.message };
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
    const user = getCurrentUser();

    if (!user) {
      return { success: false, error: "עליך להתחבר לפני עדכון מטלות" };
    }

    const dataSource = await getDataSource(user.uid);
    if (!dataSource.success) {
      return { success: false, error: dataSource.error };
    }

    const taskRef = ref(database, `${dataSource.path}/tasks/${taskId}`);
    await update(taskRef, {
      ...taskData,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid,
    });

    return { success: true };
  } catch (error) {
    console.error("שגיאה בעדכון מטלה:", error);
    return { success: false, error: error.message };
  }
};

/**
 * מחיקת מטלה
 * @param {string} taskId - מזהה המטלה למחיקה
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const deleteTask = async (taskId) => {
  try {
    const user = getCurrentUser();

    if (!user) {
      return { success: false, error: "עליך להתחבר לפני מחיקת מטלות" };
    }

    const dataSource = await getDataSource(user.uid);
    if (!dataSource.success) {
      return { success: false, error: dataSource.error };
    }

    const taskRef = ref(database, `${dataSource.path}/tasks/${taskId}`);
    await remove(taskRef);

    return { success: true };
  } catch (error) {
    console.error("שגיאה במחיקת מטלה:", error);
    return { success: false, error: error.message };
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
