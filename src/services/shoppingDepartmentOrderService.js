import { database } from "../firebase/config";
import { ref, get, set, onValue } from "firebase/database";
import { getCurrentUser, getDataSource } from "./userService";
import {
  DEFAULT_STORE_DEPARTMENT_ORDER,
  sanitizeDepartmentOrder,
} from "../constants/storeDepartments";

const PREFERENCES_KEY = "preferences/shopping_department_order";

async function getPreferencesPath() {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("Must be logged in");
  }
  const dataSource = await getDataSource(user.uid);
  if (!dataSource.success) {
    throw new Error(dataSource.error);
  }
  return `${dataSource.path}/${PREFERENCES_KEY}`;
}

export async function getShoppingDepartmentOrder() {
  try {
    const path = await getPreferencesPath();
    const snap = await get(ref(database, path));
    if (snap.exists() && Array.isArray(snap.val())) {
      return sanitizeDepartmentOrder(snap.val());
    }
    return [...DEFAULT_STORE_DEPARTMENT_ORDER];
  } catch (error) {
    console.warn("getShoppingDepartmentOrder:", error.message);
    return [...DEFAULT_STORE_DEPARTMENT_ORDER];
  }
}

export async function saveShoppingDepartmentOrder(order) {
  const path = await getPreferencesPath();
  const sanitized = sanitizeDepartmentOrder(order);
  await set(ref(database, path), sanitized);
  return sanitized;
}

export function subscribeShoppingDepartmentOrder(callback) {
  let unsubscribe = () => {};
  getPreferencesPath()
    .then((path) => {
      const orderRef = ref(database, path);
      unsubscribe = onValue(orderRef, (snap) => {
        if (snap.exists() && Array.isArray(snap.val())) {
          callback(sanitizeDepartmentOrder(snap.val()));
        } else {
          callback([...DEFAULT_STORE_DEPARTMENT_ORDER]);
        }
      });
    })
    .catch((error) => {
      console.warn("subscribeShoppingDepartmentOrder:", error.message);
      callback([...DEFAULT_STORE_DEPARTMENT_ORDER]);
    });

  return () => unsubscribe();
}
