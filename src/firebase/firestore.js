// src/firebase/firestore.js
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import app from "./config";

const db = getFirestore(app);

export const addProject = async (userId, project) => {
  // Guarda el proyecto en la colección "users/{userId}/projects"
  return await addDoc(collection(db, "users", userId, "projects"), {
    ...project,
    createdAt: serverTimestamp(),
  });
};

export default db;
