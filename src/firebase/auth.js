// src/firebase/auth.js
// Configuración de autenticación con Firebase
import { getAuth, GithubAuthProvider, signInWithPopup, signOut, signInWithCustomToken } from "firebase/auth";
import app from "./config";

const auth = getAuth(app);
const githubProvider = new GithubAuthProvider();

// Iniciar sesión con GitHub
export const signInWithGitHub = () => signInWithPopup(auth, githubProvider);

// Iniciar sesión con un token personalizado
export const signInWithCustom = (token) => signInWithCustomToken(auth, token);

// Cerrar sesión
export const logout = () => signOut(auth);

export default auth;
