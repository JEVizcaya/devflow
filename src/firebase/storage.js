// src/firebase/storage.js
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app from "./config";

const storage = getStorage(app);

export const uploadProjectImage = async (userId, file) => {
  const imageRef = ref(storage, `users/${userId}/projects/${Date.now()}_${file.name}`);
  await uploadBytes(imageRef, file);
  return await getDownloadURL(imageRef);
};

export default storage;
