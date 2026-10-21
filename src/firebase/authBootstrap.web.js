import { getAuth } from "firebase/auth";

export function createAuth(app) {
  return getAuth(app);
}
