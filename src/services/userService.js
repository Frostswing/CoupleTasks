import { auth, database, app, checkFirebaseStatus } from "../firebase/config";
import { initializeDatabase, createUserProfile, initializeUserFirstLogin } from "../firebase/database-init";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
} from "firebase/database";

// בדיקה מקיפה של כל שירותי Firebase
const checkFirebaseServices = () => {
  const status = checkFirebaseStatus();
  console.log("Firebase services status:", status);
  return status;
};

// בדיקה האם שירות האימות מוכן
const isAuthReady = () => {
  const status = checkFirebaseStatus();

  if (!status.authInitialized) {
    console.warn("Auth is not initialized yet");
    return false;
  }

  try {
    // בדיקה פשוטה שהאובייקט קיים ויש לו את המאפיינים הדרושים
    return typeof auth.onAuthStateChanged === "function";
  } catch (error) {
    console.error("Error checking auth readiness:", error);
    return false;
  }
};

// בדיקה האם Firebase מוכן
const isFirebaseReady = () => {
  const status = checkFirebaseStatus();
  return status.appInitialized && status.databaseInitialized;
};

// המתנה עד שהאימות יהיה מוכן
const waitForAuth = (maxRetries = 10, interval = 500) => {
  return new Promise((resolve, reject) => {
    // בדיקה מקיפה של שירותי Firebase
    const status = checkFirebaseServices();

    // אם Firebase לא מוכן, נכשל מיד
    if (!status.appInitialized) {
      reject(
        new Error(`Firebase app is not initialized: ${JSON.stringify(status)}`)
      );
      return;
    }

    let retries = 0;

    const checkAuth = () => {
      if (isAuthReady()) {
        resolve(true);
        return;
      }

      retries++;
      if (retries >= maxRetries) {
        const status = checkFirebaseServices(); // בדיקה נוספת לפני הכישלון הסופי
        reject(
          new Error(
            `Auth service not ready after ${maxRetries} retries. Status: ${JSON.stringify(
              status
            )}`
          )
        );
        return;
      }

      console.log(
        `Auth not ready, retrying in ${interval}ms (attempt ${retries}/${maxRetries})`
      );
      setTimeout(checkAuth, interval);
    };

    checkAuth();
  });
};

/**
 * הרשמת משתמש חדש
 * @param {string} email - אימייל המשתמש
 * @param {string} password - סיסמת המשתמש
 * @param {string} name - שם המשתמש
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const registerUser = async (email, password, name) => {
  try {
    // וודא שהאימות מוכן
    await waitForAuth();

    // לוג של מצב Firebase לפני הרישום
    console.log("Firebase status before registration:", checkFirebaseStatus());

    // יצירת משתמש בשירות האימות של פיירבייס
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // שמירת מידע נוסף על המשתמש במסד הנתונים
    await set(ref(database, `users/${user.uid}/profile`), {
      email: email,
      name: name,
      createdAt: new Date().toISOString(),
    });

    return { success: true, user };
  } catch (error) {
    console.error("שגיאה ברישום משתמש:", error);
    console.log("Firebase status during error:", checkFirebaseStatus());
    return { success: false, error };
  }
};

/**
 * כניסת משתמש קיים
 * @param {string} email - אימייל המשתמש
 * @param {string} password - סיסמת המשתמש
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const loginUser = async (email, password) => {
  try {
    // וודא שהאימות מוכן
    await waitForAuth();

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("שגיאה בכניסת משתמש:", error);
    return { success: false, error };
  }
};

/**
 * יציאת משתמש מהמערכת
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const logoutUser = async () => {
  try {
    // וודא שהאימות מוכן
    await waitForAuth();

    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("שגיאה ביציאה מהמערכת:", error);
    return { success: false, error };
  }
};

/**
 * האזנה לשינויים במצב האימות של המשתמש
 * @param {function} callback - פונקציה שתתבצע כאשר יש שינוי במצב האימות
 * @returns {function} - פונקציית הסרת האזנה
 */
export const subscribeToAuthChanges = (callback) => {
  // בדיקה שהאימות מוכן
  if (!isAuthReady()) {
    console.warn("Auth not ready yet, will retry in 500ms");
    setTimeout(() => subscribeToAuthChanges(callback), 500);
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

/**
 * קבלת פרטי המשתמש הנוכחי
 * @returns {Object} - המשתמש הנוכחי או null אם אין משתמש מחובר
 */
export const getCurrentUser = () => {
  // בדיקה שהאימות מוכן
  if (!isAuthReady()) {
    console.warn("Auth not ready yet when getting current user");
    return null;
  }

  return auth.currentUser;
};

/**
 * קבלת פרופיל המשתמש מהדאטהבייס
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה ומחזירה את המידע
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = ref(database, `users/${userId}/profile`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return { success: true, profile: snapshot.val() };
    } else {
      return { success: false, error: "לא נמצא פרופיל למשתמש" };
    }
  } catch (error) {
    console.error("שגיאה בקבלת פרופיל משתמש:", error);
    return { success: false, error };
  }
};

/**
 * חיפוש משתמש לפי אימייל
 * @param {string} email - אימייל המשתמש לחיפוש
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה ומחזירה את המידע
 */
export const findUserByEmail = async (email) => {
  try {
    // פיירבייס אינו תומך בחיפוש לפי שדות, אז נצטרך לטעון את כל המשתמשים ולחפש באופן לוקלי
    // זו אינה הדרך האופטימלית, אך עובדת לאפליקציות קטנות
    const usersRef = ref(database, "users");
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      return { success: false, error: "לא נמצאו משתמשים" };
    }

    const users = snapshot.val();
    let foundUser = null;
    let foundUserId = null;

    Object.entries(users).forEach(([userId, userData]) => {
      if (userData.profile && userData.profile.email === email) {
        foundUser = userData.profile;
        foundUserId = userId;
      }
    });

    if (foundUser) {
      return { success: true, user: foundUser, userId: foundUserId };
    } else {
      return { success: false, error: "לא נמצא משתמש עם האימייל הזה" };
    }
  } catch (error) {
    console.error("שגיאה בחיפוש משתמש:", error);
    return { success: false, error };
  }
};

/**
 * יצירת מרחב משותף למשתמשים
 * @param {string} currentUserId - מזהה המשתמש הנוכחי
 * @param {string} sharedUserId - מזהה המשתמש לשיתוף
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const createSharedSpace = async (currentUserId, sharedUserId) => {
  try {
    // יצירת מזהה משותף - תמיד נסדר אותם אלפביתית כדי להבטיח עקביות
    const [userId1, userId2] = [currentUserId, sharedUserId].sort();
    const sharedId = `${userId1}_${userId2}`;

    // יצירת המרחב המשותף
    await set(ref(database, `shared/${sharedId}/members`), {
      [userId1]: true,
      [userId2]: true,
    });

    // עדכון המשתמשים לציין שהם משתפים רשימות
    await update(ref(database, `users/${currentUserId}/profile`), {
      sharingWith: sharedUserId,
      sharedSpaceId: sharedId,
    });

    await update(ref(database, `users/${sharedUserId}/profile`), {
      sharingWith: currentUserId,
      sharedSpaceId: sharedId,
    });

    // הגירת הנתונים הקודמים של המשתמש הנוכחי למרחב המשותף
    const migrateUserData = async (path) => {
      const dataRef = ref(database, `users/${currentUserId}/${path}`);
      const snapshot = await get(dataRef);

      if (snapshot.exists()) {
        // העתקת הנתונים למרחב המשותף
        await set(ref(database, `shared/${sharedId}/${path}`), snapshot.val());
      }
    };

    // הגירת הנתונים
    await migrateUserData("tasks");
    await migrateUserData("shoppingList");

    return { success: true, sharedId };
  } catch (error) {
    console.error("שגיאה ביצירת מרחב משותף:", error);
    return { success: false, error };
  }
};

/**
 * ביטול השיתוף בין משתמשים
 * @param {string} currentUserId - מזהה המשתמש הנוכחי
 * @param {string} sharedUserId - מזהה המשתמש ששיתפנו איתו
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const removeSharing = async (currentUserId, sharedUserId) => {
  try {
    // קבלת מזהה המרחב המשותף
    const userProfileRef = ref(database, `users/${currentUserId}/profile`);
    const profileSnapshot = await get(userProfileRef);

    if (!profileSnapshot.exists() || !profileSnapshot.val().sharedSpaceId) {
      return { success: false, error: "לא קיים מרחב משותף" };
    }

    const sharedSpaceId = profileSnapshot.val().sharedSpaceId;

    // קבלת הנתונים המשותפים
    const sharedDataRef = ref(database, `shared/${sharedSpaceId}`);
    const sharedSnapshot = await get(sharedDataRef);

    if (sharedSnapshot.exists()) {
      // העתקת הנתונים המשותפים למשתמש הנוכחי
      if (sharedSnapshot.val().tasks) {
        await set(
          ref(database, `users/${currentUserId}/tasks`),
          sharedSnapshot.val().tasks
        );
      }

      if (sharedSnapshot.val().shoppingList) {
        await set(
          ref(database, `users/${currentUserId}/shoppingList`),
          sharedSnapshot.val().shoppingList
        );
      }
    }

    // עדכון פרופיל המשתמש הנוכחי להסרת השיתוף
    await update(ref(database, `users/${currentUserId}/profile`), {
      sharingWith: null,
      sharedSpaceId: null,
    });

    // עדכון פרופיל המשתמש המשותף להסרת השיתוף
    await update(ref(database, `users/${sharedUserId}/profile`), {
      sharingWith: null,
      sharedSpaceId: null,
    });

    // מחיקת המרחב המשותף
    // הערה: ניתן לשקול לא למחוק את המרחב המשותף לגיבוי
    await remove(ref(database, `shared/${sharedSpaceId}`));

    return { success: true };
  } catch (error) {
    console.error("שגיאה בביטול שיתוף:", error);
    return { success: false, error };
  }
};

/**
 * בדיקה האם המשתמש משתף רשימות עם משתמש אחר
 * @param {string} userId - מזהה המשתמש לבדיקה
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const checkIfSharing = async (userId) => {
  try {
    const userProfileRef = ref(database, `users/${userId}/profile`);
    const snapshot = await get(userProfileRef);

    if (snapshot.exists() && snapshot.val().sharingWith) {
      const sharingWithId = snapshot.val().sharingWith;
      const sharedSpaceId = snapshot.val().sharedSpaceId;

      // קבלת פרטי המשתמש המשותף
      const sharedUserSnapshot = await get(
        ref(database, `users/${sharingWithId}/profile`)
      );

      if (sharedUserSnapshot.exists()) {
        return {
          success: true,
          isSharing: true,
          sharingWith: {
            userId: sharingWithId,
            profile: sharedUserSnapshot.val(),
          },
          sharedSpaceId,
        };
      }
    }

    return { success: true, isSharing: false };
  } catch (error) {
    console.error("שגיאה בבדיקת שיתוף:", error);
    return { success: false, error };
  }
};

/**
 * קבלת מקור הנתונים עבור מטלות ורשימת קניות
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise} - הבטחה שמתרחשת עם סיום הפעולה
 */
export const getDataSource = async (userId) => {
  try {
    // הוספת לוגים לאיתור בעיות
    console.log("getDataSource נקרא עבור userId:", userId);

    if (!userId) {
      console.error("getDataSource: לא התקבל מזהה משתמש");
      return { success: false, error: "לא התקבל מזהה משתמש" };
    }

    // קריאה לפונקציה המקורית שבודקת שיתוף
    const sharingStatus = await checkIfSharing(userId);
    console.log("getDataSource: תוצאת בדיקת שיתוף:", sharingStatus);

    // בדיקה אם המשתמש משתף ויש לו מזהה למרחב משותף
    if (
      sharingStatus.success &&
      sharingStatus.isSharing &&
      sharingStatus.sharedSpaceId
    ) {
      console.log(
        "getDataSource: משתמש עם מרחב משותף:",
        sharingStatus.sharedSpaceId
      );
      return {
        success: true,
        path: `shared/${sharingStatus.sharedSpaceId}`,
        isShared: true,
      };
    } else {
      console.log("getDataSource: משתמש ללא מרחב משותף, משתמש בנתונים אישיים");
      return {
        success: true,
        path: `users/${userId}`,
        isShared: false,
      };
    }
  } catch (error) {
    console.error("getDataSource שגיאה:", error);
    return { success: false, error: error.message };
  }
};
