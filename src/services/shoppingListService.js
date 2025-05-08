import { database } from "../firebase/config";
import {
  ref,
  set,
  onValue,
  push,
  remove,
  update,
  get,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { getCurrentUser, getDataSource } from "./userService";

/**
 * קבלת כל פריטי רשימת הקניות מהמסד נתונים
 * @param {function} callback - פונקציה שתתבצע כאשר המידע מתקבל
 * @returns {function} - פונקציית הסרת האזנה
 */
export const subscribeShoppingList = (callback) => {
  console.log("subscribeShoppingList: התחילה האזנה לרשימת קניות");

  const user = getCurrentUser();
  if (!user) {
    console.log("subscribeShoppingList: משתמש לא מחובר, מחזיר רשימה ריקה");
    callback({
      shoppingItems: [],
      inventoryItems: [],
      dataSource: { isShared: false },
    });
    return () => {}; // פונקציית ניקוי ריקה
  }

  getDataSource(user.uid).then((dataSource) => {
    if (!dataSource.success) {
      console.error(
        "subscribeShoppingList: שגיאה בקבלת מקור הנתונים:",
        dataSource.error
      );
      callback({
        shoppingItems: [],
        inventoryItems: [],
        dataSource: { isShared: false },
        error: dataSource.error,
      });
      return;
    }

    console.log(
      `subscribeShoppingList: מאזין לנתיב ${dataSource.path}/shoppingList`
    );
    const shoppingListRef = ref(database, `${dataSource.path}/shoppingList`);

    // האזנה לשינויים
    const unsubscribe = onValue(
      shoppingListRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          console.log("subscribeShoppingList: אין נתונים ברשימה");
          callback({
            shoppingItems: [],
            inventoryItems: [],
            dataSource,
          });
          return;
        }

        try {
          const now = new Date();
          const data = snapshot.val();

          // המרת נתונים למערך
          const itemsList = Object.entries(data).map(([id, item]) => ({
            id,
            ...item,
          }));

          console.log(
            `subscribeShoppingList: התקבלו ${itemsList.length} פריטים`
          );

          // מיון הפריטים לפי סוגים
          const shoppingItems = itemsList.filter((item) => {
            // פריטים ברשימת הקניות:
            // 1. פריטים נחוצים שחסרה מהם כמות (מתחשבים גם בכמות "רוצים")
            // 2. פריטי מותרות שעוד לא נקנו
            // 3. פריטים שסומנו כנקנו אבל עדיין מוצגים ברשימה עם קו מחיקה

            // בדיקה של "רוצים" לעומת "צריך" - לוקחים את הערך הגבוה מביניהם
            const effectiveNeededAmount = item.isEssential
              ? Math.max(item.neededAmount || 0, item.wantedAmount || 0)
              : item.neededAmount || 0;

            const result =
              (item.isEssential &&
                effectiveNeededAmount > (item.availableAmount || 0)) ||
              (!item.isEssential && !item.purchased) ||
              (item.keepInListUntil && new Date(item.keepInListUntil) > now);

            if (result) {
              console.log(
                `subscribeShoppingList: פריט ${item.name} (${item.id}) ברשימת קניות. צריך: ${item.neededAmount}, רוצים: ${item.wantedAmount}, יש: ${item.availableAmount}`
              );
            }
            return result;
          });

          const inventoryItems = itemsList.filter((item) => {
            // פריטים ברשימת המלאי:
            // 1. פריטים נחוצים שיש מהם מספיק כמות
            // 2. לא כולל פריטים שרק עכשיו נקנו ונמצאים זמנית ברשימת הקניות

            // בדיקה של "רוצים" לעומת "צריך" - לוקחים את הערך הגבוה מביניהם
            const effectiveNeededAmount = item.isEssential
              ? Math.max(item.neededAmount || 0, item.wantedAmount || 0)
              : item.neededAmount || 0;

            const result =
              item.isEssential &&
              effectiveNeededAmount <= (item.availableAmount || 0) &&
              (!item.keepInListUntil || new Date(item.keepInListUntil) <= now);

            if (result) {
              console.log(
                `subscribeShoppingList: פריט ${item.name} (${item.id}) ברשימת מלאי. צריך: ${item.neededAmount}, רוצים: ${item.wantedAmount}, יש: ${item.availableAmount}`
              );
            }
            return result;
          });

          console.log(
            `subscribeShoppingList: בשימת קניות ${shoppingItems.length} פריטים, ברשימת מלאי ${inventoryItems.length} פריטים`
          );

          callback({
            shoppingItems,
            inventoryItems,
            dataSource,
          });
        } catch (error) {
          console.error(
            "subscribeShoppingList: שגיאה בעיבוד נתוני הרשימה:",
            error
          );
          callback({
            shoppingItems: [],
            inventoryItems: [],
            dataSource,
            error: error.message,
          });
        }
      },
      (error) => {
        console.error(
          "subscribeShoppingList: שגיאה בקבלת נתונים מפיירבייס:",
          error
        );
        callback({
          shoppingItems: [],
          inventoryItems: [],
          dataSource,
          error: error.message,
        });
      }
    );

    return unsubscribe;
  });

  // פונקציית ניקוי
  return () => {
    console.log("subscribeShoppingList: הסרת האזנה");
    // פונקציית הניקוי האמיתית תוחזר מהתוך getDataSource
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

    // בדיקה האם כבר קיים פריט עם אותו שם
    const snapshot = await get(shoppingListRef);
    const existingItems = snapshot.val() || {};

    // חיפוש פריט עם אותו שם
    let existingItemId = null;
    Object.entries(existingItems).forEach(([id, existingItem]) => {
      if (
        existingItem.name.trim().toLowerCase() ===
        item.name.trim().toLowerCase()
      ) {
        existingItemId = id;
      }
    });

    // אם נמצא פריט קיים, נעדכן את הכמות והמאפיינים שלו
    if (existingItemId) {
      const existingItem = existingItems[existingItemId];
      const newQuantity = Math.max(
        (existingItem.neededAmount || 1) - (existingItem.availableAmount || 0),
        (existingItem.quantity || 1) + (item.quantity || 1)
      );

      // עדכון כמות מבוקשת
      const neededAmount =
        item.neededAmount !== undefined
          ? item.neededAmount
          : existingItem.neededAmount || newQuantity;

      // שמירה על כמות קיימת או הגדרת ברירת מחדל
      const availableAmount =
        item.availableAmount !== undefined
          ? item.availableAmount
          : existingItem.availableAmount || 0;

      // שמירה על הגדרת נחיצות או הגדרת ברירת מחדל
      const isEssential =
        item.isEssential !== undefined
          ? item.isEssential
          : existingItem.isEssential !== undefined
          ? existingItem.isEssential
          : true;

      // שמירה על כמות רצויה או הגדרת ברירת מחדל
      const wantedAmount =
        item.wantedAmount !== undefined
          ? item.wantedAmount
          : existingItem.wantedAmount || 0;

      const itemRef = ref(
        database,
        `${dataSource.path}/shoppingList/${existingItemId}`
      );
      await update(itemRef, {
        quantity: newQuantity,
        neededAmount: neededAmount,
        availableAmount: availableAmount,
        wantedAmount: wantedAmount,
        isEssential: isEssential,
        purchased: existingItem.purchased || false,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
      });

      console.log("Updated existing item, ID:", existingItemId);
      return { success: true, id: existingItemId, isUpdate: true };
    }

    // אם לא נמצא פריט קיים, ניצור פריט חדש
    const newItemRef = push(shoppingListRef);
    await set(newItemRef, {
      name: item.name,
      quantity: item.quantity || 1,
      neededAmount: item.neededAmount || item.quantity || 1,
      availableAmount: item.availableAmount || 0,
      wantedAmount: item.wantedAmount || 0,
      isEssential: item.isEssential !== undefined ? item.isEssential : true,
      purchased: false,
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
    });

    console.log("Shopping item added with ID:", newItemRef.key);
    return { success: true, id: newItemRef.key, isUpdate: false };
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
 * @param {boolean} purchased - האם הפריט נרכש
 * @param {number} purchasedQuantity - כמות שנרכשה (אופציונלי)
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const toggleItemPurchased = async (
  itemId,
  purchased,
  purchasedQuantity = 1
) => {
  try {
    console.log("Toggle item purchased:", itemId, purchased, purchasedQuantity);
    const user = getCurrentUser();

    if (!user) {
      return { success: false, error: "עליך להתחבר לפני עדכון פריטים ברשימה" };
    }

    const dataSource = await getDataSource(user.uid);
    if (!dataSource.success) {
      return { success: false, error: dataSource.error };
    }

    const itemRef = ref(database, `${dataSource.path}/shoppingList/${itemId}`);
    const snapshot = await get(itemRef);
    const item = snapshot.val();

    if (!item) {
      return { success: false, error: "הפריט לא נמצא" };
    }

    const now = new Date();
    let updateData = {};

    // אם מבטלים את הסימון "נרכש" - פונקציית ביטול
    if (!purchased) {
      // אם יש ערכים שנשמרו טרם הרכישה, נשחזר אותם
      if (item.previousAvailableAmount !== undefined) {
        updateData.availableAmount = item.previousAvailableAmount;
      }
      if (item.previousWantedAmount !== undefined) {
        updateData.wantedAmount = item.previousWantedAmount;
      }

      updateData.purchased = false;
      updateData.keepInListUntil = null;
      updateData.purchasedQuantity = 0;
      updateData.previousAvailableAmount = null;
      updateData.previousWantedAmount = null;

      return updateShoppingItem(itemId, updateData);
    }

    // שמירת המצב הנוכחי לפני השינוי
    updateData.previousAvailableAmount = item.availableAmount || 0;
    updateData.previousWantedAmount = item.wantedAmount || 0;

    // מסמן שהפריט נרכש
    updateData.purchased = true;
    updateData.purchasedQuantity = purchasedQuantity;

    // עדכון כמות שנרכשה במלאי
    const newAvailableAmount = (item.availableAmount || 0) + purchasedQuantity;
    updateData.availableAmount = newAvailableAmount;

    // קביעת מועד פקיעה לרשימה
    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + 1);

    // שמירת הפריט ברשימה למשך יום
    updateData.keepInListUntil = expiryDate.toISOString();

    // אם זה פריט מותרות, הגדר גם זמן מחיקה
    if (!item.isEssential) {
      updateData.expiresAt = expiryDate.toISOString();
    }

    // איפוס הכמות הרצויה אחרי יום
    updateData.wantedAmount = 0;

    console.log("Updating with:", updateData);
    return updateShoppingItem(itemId, updateData);
  } catch (error) {
    console.error("שגיאה בעדכון סטטוס רכישה:", error);
    return { success: false, error: error.message };
  }
};

/**
 * מחיקת פריטי מותרות שחלף זמנם
 * פונקציה זו צריכה לרוץ בתזמון או בפתיחת האפליקציה
 */
export const cleanupExpiredItems = async () => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: "אין משתמש מחובר" };
    }

    const dataSource = await getDataSource(user.uid);
    if (!dataSource.success) {
      return { success: false, error: dataSource.error };
    }

    const shoppingListRef = ref(database, `${dataSource.path}/shoppingList`);
    const snapshot = await get(shoppingListRef);
    const items = snapshot.val() || {};

    const now = new Date();
    const itemsToDelete = [];
    const itemsToUpdate = [];

    // בדיקת פריטים שפג תוקפם או שנרכשו ונשארו ברשימה מעל יום
    Object.entries(items).forEach(([id, item]) => {
      // פריטי מותרות שפג תוקפם - למחיקה
      if (!item.isEssential && item.expiresAt) {
        const expiryDate = new Date(item.expiresAt);
        if (expiryDate < now) {
          itemsToDelete.push(id);
        }
      }

      // פריטים נחוצים שנקנו ונשארו ברשימה מעל יום - להסירת הסימון ברשימה
      if (item.isEssential && item.keepInListUntil) {
        const keepUntilDate = new Date(item.keepInListUntil);
        if (keepUntilDate < now) {
          itemsToUpdate.push({
            id,
            updates: {
              keepInListUntil: null,
              // אם יש מספיק ממנו לא צריך יותר לסמן כנרכש
              purchased: item.availableAmount < item.neededAmount,
            },
          });
        }
      }
    });

    // מחיקת הפריטים שפג תוקפם
    const deletePromises = itemsToDelete.map((id) => {
      const itemRef = ref(database, `${dataSource.path}/shoppingList/${id}`);
      return remove(itemRef);
    });

    // עדכון פריטים שצריך להסיר מהרשימה
    const updatePromises = itemsToUpdate.map(({ id, updates }) => {
      const itemRef = ref(database, `${dataSource.path}/shoppingList/${id}`);
      return update(itemRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
      });
    });

    await Promise.all([...deletePromises, ...updatePromises]);

    return {
      success: true,
      deletedCount: itemsToDelete.length,
      updatedCount: itemsToUpdate.length,
      message: `נמחקו ${itemsToDelete.length} פריטים שפג תוקפם, עודכנו ${itemsToUpdate.length} פריטים`,
    };
  } catch (error) {
    console.error("שגיאה בניקוי פריטים שפג תוקפם:", error);
    return { success: false, error: error.message };
  }
};

/**
 * עדכון כמות מוצר במלאי
 * @param {string} itemId - מזהה הפריט
 * @param {number} amount - הכמות החדשה במלאי
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const updateItemInventory = async (itemId, amount) => {
  return updateShoppingItem(itemId, { availableAmount: amount });
};

/**
 * עדכון כמות מוצר הנדרשת
 * @param {string} itemId - מזהה הפריט
 * @param {number} amount - הכמות הנדרשת
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const updateItemNeededAmount = async (itemId, amount) => {
  return updateShoppingItem(itemId, { neededAmount: amount });
};

/**
 * שינוי סטטוס הנחיצות של מוצר
 * @param {string} itemId - מזהה הפריט
 * @param {boolean} isEssential - האם הפריט נחוץ
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const toggleItemEssential = async (itemId, isEssential) => {
  return updateShoppingItem(itemId, { isEssential });
};

/**
 * איפוס כמות במלאי של פריט
 * @param {string} itemId - מזהה הפריט
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const resetItemInventory = async (itemId) => {
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
    const snapshot = await get(itemRef);
    const item = snapshot.val();

    if (!item) {
      return { success: false, error: "הפריט לא נמצא" };
    }

    // איפוס הכמות במלאי
    await update(itemRef, {
      availableAmount: 0,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid,
    });

    return { success: true };
  } catch (error) {
    console.error("שגיאה באיפוס כמות במלאי:", error);
    return { success: false, error: error.message };
  }
};

/**
 * עדכון כמות רצויה של פריט
 * @param {string} itemId - מזהה הפריט
 * @param {number} wantedAmount - הכמות הרצויה
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const updateItemWantedAmount = async (itemId, wantedAmount) => {
  try {
    console.log(
      `updateItemWantedAmount: עדכון ערך רוצים - ID: ${itemId}, ערך חדש: ${wantedAmount}`
    );

    const user = getCurrentUser();
    if (!user) {
      console.error("updateItemWantedAmount: משתמש לא מחובר");
      return { success: false, error: "עליך להתחבר לפני עדכון פריטים ברשימה" };
    }

    const dataSource = await getDataSource(user.uid);
    if (!dataSource.success) {
      console.error(
        "updateItemWantedAmount: שגיאה בקבלת מקור מידע:",
        dataSource.error
      );
      return { success: false, error: dataSource.error };
    }

    console.log(
      `updateItemWantedAmount: מסלול עדכון: ${dataSource.path}/shoppingList/${itemId}`
    );

    const itemRef = ref(database, `${dataSource.path}/shoppingList/${itemId}`);

    // בדיקה שהפריט קיים
    const snapshot = await get(itemRef);
    if (!snapshot.exists()) {
      console.error("updateItemWantedAmount: הפריט לא נמצא");
      return { success: false, error: "הפריט לא נמצא" };
    }

    const item = snapshot.val();
    console.log("updateItemWantedAmount: פריט לפני עדכון:", item);

    // עדכון הערך
    await update(itemRef, {
      wantedAmount: wantedAmount,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid,
    });

    // אימות שהעדכון אכן בוצע
    const updatedSnapshot = await get(itemRef);
    const updatedItem = updatedSnapshot.val();
    console.log("updateItemWantedAmount: פריט אחרי עדכון:", updatedItem);

    if (updatedItem.wantedAmount !== wantedAmount) {
      console.error(
        `updateItemWantedAmount: הערך לא התעדכן כצפוי. צפוי: ${wantedAmount}, בפועל: ${updatedItem.wantedAmount}`
      );
      return { success: false, error: "ערך לא התעדכן בהצלחה" };
    }

    console.log("updateItemWantedAmount: עדכון הושלם בהצלחה");
    return { success: true };
  } catch (error) {
    console.error("updateItemWantedAmount שגיאה:", error);
    return { success: false, error: error.message };
  }
};

/**
 * סיום מחזור קניות והתחלה מחדש של הרשימה
 * מעביר את כל הפריטים שנרכשו למלאי, מוחק מוצרי מותרות ומאפס את כל הערכים הנדרשים
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const finishShoppingCycle = async () => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "עליך להתחבר לפני עדכון רשימת הקניות",
      };
    }

    const dataSource = await getDataSource(user.uid);
    if (!dataSource.success) {
      return { success: false, error: dataSource.error };
    }

    // קבלת כל הפריטים ברשימה
    const listRef = ref(database, `${dataSource.path}/shoppingList`);
    const snapshot = await get(listRef);
    if (!snapshot.exists()) {
      return { success: true, message: "אין פריטים ברשימה" };
    }

    const items = snapshot.val();
    const itemsArray = Object.entries(items).map(([id, item]) => ({
      id,
      ...item,
    }));

    // עיבוד כל פריט ברשימה
    const updates = {};
    let processedCount = 0;

    for (const item of itemsArray) {
      // פריטים שנרכשו
      if (item.purchased) {
        if (item.isEssential) {
          // פריטים נחוצים - משאירים אבל מסירים את הסימון נרכש ומעדכנים את המלאי
          updates[
            `${dataSource.path}/shoppingList/${item.id}/purchased`
          ] = false;
          updates[
            `${dataSource.path}/shoppingList/${item.id}/purchasedQuantity`
          ] = 0;
          updates[
            `${dataSource.path}/shoppingList/${item.id}/keepInListUntil`
          ] = null;
          updates[
            `${dataSource.path}/shoppingList/${item.id}/wantedAmount`
          ] = 0; // מאפסים את הכמות הרצויה רק עבור פריטים שנקנו
          // אם יש כמות קנייה, מעדכנים את המלאי אם עוד לא עודכן
          if (item.purchasedQuantity && item.purchasedQuantity > 0) {
            // רק אם עדיין לא הוספנו את הכמות למלאי (כדי למנוע כפילויות)
            if (!item.availableAmountUpdated) {
              const newAvailableAmount =
                (item.availableAmount || 0) + item.purchasedQuantity;
              updates[
                `${dataSource.path}/shoppingList/${item.id}/availableAmount`
              ] = newAvailableAmount;
              updates[
                `${dataSource.path}/shoppingList/${item.id}/availableAmountUpdated`
              ] = true;
            }
          }
        } else {
          // פריטי מותרות - מוחקים אם נרכשו
          updates[`${dataSource.path}/shoppingList/${item.id}`] = null;
        }
        processedCount++;
      }
      // הסרנו את הלוגיקה שמאפסת את wantedAmount לפריטים שלא נקנו
    }

    // ביצוע עדכון רק אם יש מה לעדכן
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
    }

    return {
      success: true,
      processedCount,
      message: `סיום מחזור קניות - עודכנו ${processedCount} פריטים`,
    };
  } catch (error) {
    console.error("שגיאה בסיום מחזור קניות:", error);
    return { success: false, error: error.message };
  }
};
