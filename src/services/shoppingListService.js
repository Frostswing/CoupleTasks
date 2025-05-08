import { database } from "../firebase/config";
import { ref, set, onValue, push, remove, update } from "firebase/database";
import { getCurrentUser, getDataSource } from "./userService";

/**
 * קבלת כל פריטי רשימת הקניות מהמסד נתונים
 * @param {function} callback - פונקציה שתתבצע כאשר המידע מתקבל
 * @returns {function} - פונקציית הסרת האזנה
 */
export const subscribeShoppingList = (callback) => {
  console.log("Subscribing to shopping list...");
  const user = getCurrentUser();

  if (!user) {
    console.log("No user logged in, can't subscribe to shopping list");
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
    const shoppingListRef = ref(database, `${dataSource.path}/shoppingList`);

    const unsubscribe = onValue(
      shoppingListRef,
      (snapshot) => {
        console.log("Received shopping list data:", snapshot.exists());
        const data = snapshot.val() || {};
        // המרת אובייקט לרשימה עם id
        const itemsList = Object.entries(data).map(([id, values]) => ({
          id,
          ...values,
        }));

        console.log("Shopping list items:", itemsList.length);
        // העברת מקור הנתונים יחד עם רשימת הפריטים
        callback(itemsList, {
          isShared: dataSource.isShared,
          path: dataSource.path,
        });
      },
      (error) => {
        console.error("שגיאה בטעינת רשימת קניות:", error);
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
 * הוספת פריט חדש לרשימת הקניות
 * @param {Object} item - פרטי הפריט
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const addShoppingItem = async (item) => {
  try {
    console.log("Adding shopping item:", item);
    const user = getCurrentUser();

    if (!user) {
      return { success: false, error: "עליך להתחבר לפני הוספת פריטים לרשימה" };
    }

    const dataSource = await getDataSource(user.uid);
    if (!dataSource.success) {
      return { success: false, error: dataSource.error };
    }

    const shoppingListRef = ref(database, `${dataSource.path}/shoppingList`);
    const newItemRef = push(shoppingListRef);

    await set(newItemRef, {
      name: item.name,
      quantity: item.quantity || 1,
      purchased: false,
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
    });

    console.log("Shopping item added with ID:", newItemRef.key);
    return { success: true, id: newItemRef.key };
  } catch (error) {
    console.error("שגיאה בהוספת פריט לרשימת קניות:", error);
    return { success: false, error: error.message };
  }
};

/**
 * עדכון פריט קיים ברשימת הקניות
 * @param {string} itemId - מזהה הפריט
 * @param {Object} itemData - נתוני הפריט לעדכון
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const updateShoppingItem = async (itemId, itemData) => {
  try {
    const user = getCurrentUser();

    if (!user) {
      return { success: false, error: "עליך להתחבר לפני עדכון פריטים ברשימה" };
    }

    const dataSource = await getDataSource(user.uid);
    if (!dataSource.success) {
      return { success: false, error: dataSource.error };
    }

    const itemRef = ref(database, `${dataSource.path}/shoppingList/${itemId}`);
    await update(itemRef, {
      ...itemData,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid,
    });

    return { success: true };
  } catch (error) {
    console.error("שגיאה בעדכון פריט ברשימת קניות:", error);
    return { success: false, error: error.message };
  }
};

/**
 * מחיקת פריט מרשימת הקניות
 * @param {string} itemId - מזהה הפריט למחיקה
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const deleteShoppingItem = async (itemId) => {
  try {
    const user = getCurrentUser();

    if (!user) {
      return { success: false, error: "עליך להתחבר לפני מחיקת פריטים מהרשימה" };
    }

    const dataSource = await getDataSource(user.uid);
    if (!dataSource.success) {
      return { success: false, error: dataSource.error };
    }

    const itemRef = ref(database, `${dataSource.path}/shoppingList/${itemId}`);
    await remove(itemRef);

    return { success: true };
  } catch (error) {
    console.error("שגיאה במחיקת פריט מרשימת קניות:", error);
    return { success: false, error: error.message };
  }
};

/**
 * סימון פריט כנרכש או לא נרכש
 * @param {string} itemId - מזהה הפריט
 * @param {boolean} isPurchased - האם הפריט נרכש
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const toggleItemPurchased = async (itemId, isPurchased) => {
  return updateShoppingItem(itemId, { purchased: isPurchased });
};
