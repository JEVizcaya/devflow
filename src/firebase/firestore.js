// src/firebase/firestore.js
import { getFirestore, collection, addDoc, serverTimestamp, setDoc, doc, getDoc, getDocs, query, orderBy } from "firebase/firestore";
import app from "./config";

const db = getFirestore(app);

export const saveUserProfile = async (user) => {
  if (!user) return;
  // Guarda el perfil del usuario en users/{uid}
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    displayName: user.displayName || null,
    email: user.email || null,
    photoURL: user.photoURL || null,
    githubUsername: user.reloadUserInfo?.screenName || null,
    providerId: user.providerId || null,
    createdAt: serverTimestamp(),
  }, { merge: true });
};

export const addProject = async (userId, project) => {
  // Guarda el proyecto en la colección "projects" (independiente de users)
  return await addDoc(collection(db, "projects"), {
    ...project,
    ownerId: userId,
    collaborators: [], // Inicializa el array de colaboradores
    tasks: [],         // Inicializa el array de tareas
    createdAt: serverTimestamp(),
  });
};

// Añadir colaborador a un proyecto
export const addCollaboratorToProject = async (ownerId, projectId, collaboratorUid) => {
  const projectRef = doc(db, "users", ownerId, "projects", projectId);
  const projectSnap = await getDoc(projectRef);
  if (!projectSnap.exists()) throw new Error("Proyecto no encontrado");
  const data = projectSnap.data();
  if (data.collaborators && data.collaborators.includes(collaboratorUid)) return; // Ya es colaborador
  const newCollaborators = [...(data.collaborators || []), collaboratorUid];
  await setDoc(projectRef, { collaborators: newCollaborators }, { merge: true });
};

// Añadir tarea a un proyecto
export const addTaskToProject = async (ownerId, projectId, task) => {
  const projectRef = doc(db, "users", ownerId, "projects", projectId);
  const projectSnap = await getDoc(projectRef);
  if (!projectSnap.exists()) throw new Error("Proyecto no encontrado");
  const data = projectSnap.data();
  const newTasks = [...(data.tasks || []), task];
  await setDoc(projectRef, { tasks: newTasks }, { merge: true });
};

// Guardar mensaje de chat en un proyecto
export const addChatMessage = async (ownerId, projectId, message) => {
  const db = getFirestore(app);
  return await addDoc(collection(db, "users", ownerId, "projects", projectId, "chat"), {
    ...message,
    createdAt: serverTimestamp(),
  });
};

// Obtener mensajes de chat de un proyecto (ordenados por fecha)
export const getChatMessages = async (ownerId, projectId) => {
  const db = getFirestore(app);
  const q = query(collection(db, "users", ownerId, "projects", projectId, "chat"), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  const userDoc = await getDoc(doc(db, "users", uid));
  return userDoc.exists() ? userDoc.data() : null;
};

// Obtener todos los usuarios (excepto el actual)
export const getAllUsersExcept = async (excludeUid) => {
  const usersSnap = await getDocs(collection(db, "users"));
  return usersSnap.docs
    .map(doc => doc.data())
    .filter(user => user.uid !== excludeUid);
};

export default db;
