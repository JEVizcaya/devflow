import { getFirestore, doc, getDoc } from "firebase/firestore";
import app from "./config";

const db = getFirestore(app);

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  const userDoc = await getDoc(doc(db, "users", uid));
  return userDoc.exists() ? userDoc.data() : null;
};

export default db;
