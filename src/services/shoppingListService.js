import { database } from "../firebase/config";
import { ref, set, onValue, push, remove, update } from "firebase/database";

/**
 * קבלת כל פריטי רשימת הקניות מהמסד נתונים
 * @param {function} callback - פונקציה שתתבצע כאשר המידע מתקבל
 * @returns {function} - פונקציית הסרת האזנה
 */
export const subscribeShoppingList = (callback) => {
  console.log("Subscribing to shopping list...");
  const shoppingListRef = ref(database, "shoppingList");

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
      callback(itemsList);
    },
    (error) => {
      console.error("שגיאה בטעינת רשימת קניות:", error);
    }
  );

  return unsubscribe;
};

/**
 * הוספת פריט חדש לרשימת הקניות
 * @param {Object} item - פרטי הפריט
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const addShoppingItem = async (item) => {
  try {
    console.log("Adding shopping item:", item);
    const shoppingListRef = ref(database, "shoppingList");
    const newItemRef = push(shoppingListRef);

    await set(newItemRef, {
      name: item.name,
      quantity: item.quantity || 1,
      purchased: false,
      createdAt: new Date().toISOString(),
    });

    console.log("Shopping item added with ID:", newItemRef.key);
    return { success: true, id: newItemRef.key };
  } catch (error) {
    console.error("שגיאה בהוספת פריט לרשימת קניות:", error);
    return { success: false, error };
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
    const itemRef = ref(database, `shoppingList/${itemId}`);
    await update(itemRef, itemData);

    return { success: true };
  } catch (error) {
    console.error("שגיאה בעדכון פריט ברשימת קניות:", error);
    return { success: false, error };
  }
};

/**
 * מחיקת פריט מרשימת הקניות
 * @param {string} itemId - מזהה הפריט למחיקה
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const deleteShoppingItem = async (itemId) => {
  try {
    const itemRef = ref(database, `shoppingList/${itemId}`);
    await remove(itemRef);

    return { success: true };
  } catch (error) {
    console.error("שגיאה במחיקת פריט מרשימת קניות:", error);
    return { success: false, error };
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
